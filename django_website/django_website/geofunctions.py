import numpy as np

#In-place flipping
def flip_geojson_coordinates(geo):
    """
    Flips IN-PLACE coordinates of all geometries defined in a geojson object/dict/list

    Parameters
    ----------

    geo : dict
        Any geographical object containing a member called
        coordinates to be flipped, that is, its ordering
        will be reversed.

    Returns
    -------
    none
    
    """
    if isinstance(geo, dict):
        for k, v in geo.items():
            if k == "coordinates":
                z = np.asarray(geo[k])
                f = z.flatten()
                geo[k] = np.dstack((f[1::2], f[::2])).reshape(z.shape).tolist()
            else:
                flip_geojson_coordinates(v)
    elif isinstance(geo, list):
        for k in geo:
            flip_geojson_coordinates(k)