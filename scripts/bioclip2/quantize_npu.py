"""Make the NPU variant of a pack model: static quantization (int8 weights, int16 or
int8 activations), calibrated on photos fed exactly like the Android plugin.

    python bench/fetch_calibration.py                     # photos observed before 2026-06-30
    python quantize_npu.py packs/<pack>/model_fp32.tflite packs/<pack>/model_npu.tflite
    python bench/eval_tflite.py --pack packs/<pack> \\
        packs/<pack>/model_fp32.tflite packs/<pack>/model_npu.tflite

Qualcomm's Hexagon NPU runs integer activations; float ops fall back to the CPU.
--float-ops leaves the named TFLite ops unquantized (e.g. SOFTMAX) when they cost accuracy.
Calibration keeps each tensor's full min/max over all photos and is saved to --ranges,
so other activation widths or --float-ops settings reuse it without recalibrating.
"""
import argparse
import glob
import os
import pickle
import sys
import time

HERE = os.path.dirname( os.path.abspath( __file__ ) )
sys.path.insert( 0, os.path.join( HERE, "bench" ) )


def calibrate( qt, fp32_model, sig_key, input_name, photos, threads ):
    """Min/max of every activation over all photos."""
    from ai_edge_quantizer import calibrator
    from ai_edge_quantizer.utils import qsv_utils
    from eval_tflite import plugin_input

    t0 = time.time( )
    print( f"calibrating on {len( photos )} photos", flush=True )
    # The profiler-based calibrator collects min/max in C++ with XNNPACK, many times
    # faster than keeping every intermediate tensor for Python. Its default update is
    # a moving average weighted to the last ~20 photos, which clips the transformer's
    # outlier activations and the top softmax scores on the other photos; the full
    # min/max fits easily in 16-bit activations.
    calib = calibrator.Calibrator( open( fp32_model, "rb" ).read( ), num_threads=threads,
                                   mode=calibrator.CalibrationMode.CALIBRATION_PROFILER_BASED,
                                   qsv_update_func=qsv_utils.min_max_update )
    calib.calibrate( {sig_key: [{input_name: plugin_input( p )} for p in photos]}, qt._recipe_manager )
    print( f"calibrated in {time.time( ) - t0:.0f} s", flush=True )
    return calib.get_model_qsvs( )


def main( ):
    ap = argparse.ArgumentParser( description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter )
    ap.add_argument( "fp32_model" )
    ap.add_argument( "out" )
    ap.add_argument( "--calibration", default=os.path.join( HERE, "bench", "calibration", "images" ),
                     help="folder of calibration photos (never the benchmark photos)" )
    ap.add_argument( "--activations", type=int, choices=[8, 16], default=16 )
    ap.add_argument( "--float-ops", default="", help="comma list of TFLite op names to leave in float" )
    ap.add_argument( "--limit", type=int, default=0, help="use only the first N calibration photos" )
    ap.add_argument( "--threads", type=int, default=8 )
    ap.add_argument( "--ranges", help="calibrated tensor ranges, written on first use and reused after "
                                      "(default: next to the float model)" )
    args = ap.parse_args( )

    import numpy as np
    from ai_edge_quantizer import algorithm_manager, qtyping, quantizer, recipe
    from ai_edge_litert.interpreter import Interpreter

    bench_images = os.path.realpath( os.path.join( HERE, "bench", "images" ) )
    if os.path.realpath( args.calibration ) == bench_images:
        raise SystemExit( "calibrating on the benchmark photos would make the benchmark meaningless" )
    photos = sorted( glob.glob( os.path.join( args.calibration, "*.jpg" ) ) )
    if args.limit:
        photos = photos[:args.limit]

    interpreter = Interpreter( model_path=args.fp32_model )
    signatures = interpreter.get_signature_list( )
    ranks = {d["name"]: len( d["shape"] ) for d in interpreter.get_tensor_details( )}
    del interpreter
    sig_key = next( iter( signatures ) )
    input_name = signatures[sig_key]["inputs"][0]

    qt = quantizer.Quantizer( args.fp32_model )
    qt.load_quantization_recipe(
        recipe.static_wi8_ai16( ) if args.activations == 16 else recipe.static_wi8_ai8( )
    )
    # the plugin feeds and reads float32: model inputs and outputs stay float, and the
    # quantizer inserts quantize/dequantize ops behind and in front of them
    float_ops = ["INPUT", "OUTPUT"] + [o.strip( ).upper( ) for o in args.float_ops.split( "," )]
    for op in filter( None, float_ops ):
        qt.update_quantization_recipe( ".*", qtyping.TFLOperationName( op ),
                                       algorithm_key=algorithm_manager.AlgorithmName.NO_QUANTIZE )

    ranges = args.ranges or os.path.splitext( args.fp32_model )[0] + f".ranges-{len( photos )}.pkl"
    if os.path.exists( ranges ):
        with open( ranges, "rb" ) as f:
            result = pickle.load( f )
        print( f"reusing calibrated ranges from {ranges}", flush=True )
    else:
        if not photos:
            raise SystemExit( f"no calibration photos in {args.calibration}; run bench/fetch_calibration.py" )
        result = calibrate( qt, args.fp32_model, sig_key, input_name, photos, args.threads )
        with open( ranges, "wb" ) as f:
            pickle.dump( result, f )
    # that calibrator stores min/max as shape (1,); the quantizer expects one entry per
    # tensor dimension (as the default calibrator stores them) when it copies a scale
    # onto another tensor, e.g. a concatenation's constant input
    for name, qsv in result.items( ):
        shape = ( 1, ) * ranks.get( name, 1 )
        for key in ( "min", "max" ):
            qsv[key] = np.reshape( qsv[key], shape )
    qt.quantize( result ).export_model( args.out, overwrite=True )
    print( f"wrote {args.out} ({os.path.getsize( args.out ) / 1e6:.0f} MB)" )


if __name__ == "__main__":
    main( )
