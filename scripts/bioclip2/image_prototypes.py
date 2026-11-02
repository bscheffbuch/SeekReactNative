"""Image prototypes: improve the species head with real photos (GPU recommended).

BioCLIP 2 scores a photo against a text embedding per species. For groups where
text alone is weak (fish, plants), averaging the image embeddings of a few iNat
research-grade photos per species gives a "prototype" that sits where real photos
of that species land. Blending it into the text embedding,

    head[s] = normalize( text[s] + alpha * prototype[s] ),

improves the same single matrix the TFLite model already uses, so nothing changes
in the app: rebuild the pack with --text-embeddings pointing at the blended head.

    python image_prototypes.py --species-json species.json --taxa-csv taxa.csv \\
        --text-embeddings text_open.npy --text-ids text_ids.json \\
        --classes Actinopterygii,Magnoliopsida,Liliopsida --per-species 8 \\
        --before 2026-06-30 --out protos/

Writes protos/prototypes.npz (ids, emb, n) and protos/head_alpha<a>.npy for each
--alpha. --before keeps photos older than the benchmark's test observations.
Respects iNat's API limit (1 request/second); photo downloads come from the
open-data S3 bucket. Resumable: finished species are kept in protos/.
"""
import argparse
import csv
import io
import json
import os
import time

import numpy as np

API = "https://api.inaturalist.org/v1/observations"


def lineage_classes( taxa_csv, ids ):
    """taxon id -> class name, from iNat's open-data taxa.csv."""
    want = set( ids )
    rows = {}
    with open( taxa_csv, newline="", encoding="utf8" ) as f:
        for row in csv.DictReader( f, delimiter="\t" ):
            rows[int( row["taxon_id"] )] = ( row["ancestry"], row["rank"], row["name"] )
    out = {}
    for tid in want:
        anc = rows.get( tid, ( "", "", "" ) )[0]
        for a in ( anc or "" ).split( "/" ):
            if a and rows.get( int( a ), ( "", "", "" ) )[1] == "class":
                out[tid] = rows[int( a )][2]
    return out


def photo_urls( session, taxon_id, n, before ):
    params = {"taxon_id": taxon_id, "quality_grade": "research", "photos": "true",
              "per_page": n, "order_by": "votes", "d2": before}
    for attempt in range( 6 ):
        try:
            r = session.get( API, params=params, timeout=60 )
            if r.status_code == 429 or r.status_code >= 500:
                raise IOError( f"HTTP {r.status_code}" )
            r.raise_for_status( )
            urls = []
            for obs in r.json( )["results"]:
                if obs.get( "photos" ):
                    urls.append( obs["photos"][0]["url"].replace( "square", "medium" ) )
            return urls
        except Exception as e:  # noqa: BLE001 - retried
            print( f"  retry {attempt + 1} for {taxon_id}: {e}", flush=True )
            time.sleep( min( 60, 2 ** attempt ) )
    return []


def main( ):
    ap = argparse.ArgumentParser( description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter )
    ap.add_argument( "--ids-json", help="taxon ids to build prototypes for (skips --species-json/--taxa-csv "
                                        "and the head blending: just writes prototypes.npz)" )
    ap.add_argument( "--species-json" )
    ap.add_argument( "--taxa-csv" )
    ap.add_argument( "--text-embeddings" )
    ap.add_argument( "--text-ids" )
    ap.add_argument( "--classes", default="Actinopterygii",
                     help="comma list of iNat class names to build prototypes for, or 'all'" )
    ap.add_argument( "--per-species", type=int, default=8 )
    ap.add_argument( "--before", default="2026-06-30", help="only photos observed on or before this date" )
    ap.add_argument( "--alpha", default="0.5,1,2", help="blend weights to export" )
    ap.add_argument( "--limit", type=int, default=0, help="only the first N matching species (for a dry run)" )
    ap.add_argument( "--out", required=True )
    ap.add_argument( "--device", default="cuda" )
    args = ap.parse_args( )

    import requests
    import torch
    import open_clip
    from PIL import Image

    device = args.device if torch.cuda.is_available( ) or args.device == "cpu" else "cpu"
    os.makedirs( args.out, exist_ok=True )
    if args.ids_json:
        todo = [int( t ) for t in json.load( open( args.ids_json ) )]
    else:
        species = [s for s in json.load( open( args.species_json ) ) if s["rank"] in ( "species", "hybrid" )]
        ids = [s["id"] for s in species]
        wanted = None if args.classes == "all" else set( c.strip( ) for c in args.classes.split( "," ) )
        classes = lineage_classes( args.taxa_csv, ids ) if wanted else {}
        todo = [tid for tid in ids if wanted is None or classes.get( tid ) in wanted]
    if args.limit:
        todo = todo[:args.limit]
    print( f"{len( todo )} species in {args.classes}", flush=True )

    model, _, preprocess = open_clip.create_model_and_transforms( "hf-hub:imageomics/bioclip-2" )
    model.eval( ).to( device )

    ckpt_path = os.path.join( args.out, "prototypes.npz" )
    done = {}
    if os.path.exists( ckpt_path ):
        z = np.load( ckpt_path )
        done = {int( i ): ( e, int( n ) ) for i, e, n in zip( z["ids"], z["emb"], z["n"] )}
    session = requests.Session( )
    session.headers["User-Agent"] = "seek-model-pack-builder (image prototypes)"

    def save( ):
        if done:
            keys = list( done )
            np.savez( ckpt_path, ids=np.array( keys ), emb=np.stack( [done[k][0] for k in keys] ),
                      n=np.array( [done[k][1] for k in keys] ) )

    for k, tid in enumerate( todo ):
        if tid in done:
            continue
        t0 = time.time( )
        urls = photo_urls( session, tid, args.per_species, args.before )
        imgs = []
        for u in urls:
            try:
                r = session.get( u, timeout=60 )
                r.raise_for_status( )
                imgs.append( preprocess( Image.open( io.BytesIO( r.content ) ).convert( "RGB" ) ) )
            except Exception:  # noqa: BLE001 - skip broken photos
                continue
        if imgs:
            with torch.no_grad( ):
                e = model.encode_image( torch.stack( imgs ).to( device ) )
                e = torch.nn.functional.normalize( e.float( ), dim=-1 ).mean( 0 )
            done[tid] = ( torch.nn.functional.normalize( e, dim=-1 ).cpu( ).numpy( ).astype( np.float16 ), len( imgs ) )
        if k % 200 == 0:
            save( )
            print( f"  {k}/{len( todo )} species, {len( done )} with prototypes", flush=True )
        time.sleep( max( 0, 1.05 - ( time.time( ) - t0 ) ) )  # API: <= 1 request/second
    save( )
    print( f"prototypes: {len( done )} species -> {ckpt_path}", flush=True )
    if args.ids_json or not args.text_embeddings:
        return

    text = np.load( args.text_embeddings ).astype( np.float32 )
    row = {int( t ): i for i, t in enumerate( json.load( open( args.text_ids ) ) )}
    for a in [float( x ) for x in args.alpha.split( "," )]:
        head = text.copy( )
        for tid, ( e, _n ) in done.items( ):
            i = row.get( tid )
            if i is not None:
                v = head[i] + a * e.astype( np.float32 )
                head[i] = v / np.linalg.norm( v )
        np.save( os.path.join( args.out, f"head_alpha{a:g}.npy" ), head.astype( np.float16 ) )
        print( f"wrote head_alpha{a:g}.npy ({len( done )} species blended)", flush=True )


if __name__ == "__main__":
    main( )
