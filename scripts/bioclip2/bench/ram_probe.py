"""Resident memory and latency of a .tflite model on CPU (Linux /proc), as measured for
HANDOFF.md: weight-only int8 3.3 GB, dynamic-range int8 0.8 GB.

    python ram_probe.py model.tflite [xnnpack|plain] [threads]
"""
import resource
import sys
import time

import numpy as np
from ai_edge_litert.interpreter import Interpreter, OpResolverType


def rss( ):
    out = {}
    for line in open( "/proc/self/status" ):
        if line.startswith( ( "VmRSS", "RssAnon", "RssFile" ) ):
            out[line.split( )[0][:-1]] = int( line.split( )[1] ) // 1024
    return out


def show( tag ):
    peak = resource.getrusage( resource.RUSAGE_SELF ).ru_maxrss // 1024
    print( f"{tag:28s} {rss( )} MB, peak {peak} MB", flush=True )


def main( ):
    path = sys.argv[1]
    mode = sys.argv[2] if len( sys.argv ) > 2 else "xnnpack"
    threads = int( sys.argv[3] ) if len( sys.argv ) > 3 else 4
    show( "start" )
    kw = {} if mode == "xnnpack" else {"experimental_op_resolver_type": OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES}
    it = Interpreter( model_path=path, num_threads=threads, **kw )
    it.allocate_tensors( )
    show( "after allocate" )
    inp = it.get_input_details( )[0]
    it.set_tensor( inp["index"], ( np.random.rand( *inp["shape"] ) * 255 ).astype( inp["dtype"] ) )
    for n in ( 1, 2 ):
        t = time.time( )
        it.invoke( )
        show( f"invoke {n} ({time.time( ) - t:.2f}s)" )


if __name__ == "__main__":
    main( )
