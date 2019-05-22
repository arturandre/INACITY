import numpy as np
from skimage import color, exposure

ONE_THIRD = 1.0/3.0
ONE_SIXTH = 1.0/6.0
TWO_THIRD = 2.0/3.0

def decompose(mat3channels):
    return mat3channels[...,0], mat3channels[...,1], mat3channels[...,2]

def compose(ch1, ch2, ch3):
    lx, ly = ch1.shape
    mat3channels = np.zeros((lx, ly, 3), dtype=ch1.dtype)
    mat3channels[...,0] = ch1
    mat3channels[...,1] = ch2
    mat3channels[...,2] = ch3
    return mat3channels


def normalize2_rgb(rgb):
    r,g,b = decompose(rgb)
    
    sumrgb = np.sqrt((r**2)+(g**2)+(b**2))
    nzerosumrgb = sumrgb != 0
    
    nr = np.zeros(r.shape, dtype=r.dtype)
    ng = np.zeros(g.shape, dtype=g.dtype)
    nb = np.zeros(b.shape, dtype=b.dtype)
    
    nr[nzerosumrgb] = r[nzerosumrgb]/sumrgb[nzerosumrgb]
    ng[nzerosumrgb] = g[nzerosumrgb]/sumrgb[nzerosumrgb]
    nb[nzerosumrgb] = b[nzerosumrgb]/sumrgb[nzerosumrgb]
    
    return compose(nr, ng, nb)

def normalize_rgb(rgb):
    r,g,b = decompose(rgb)
    
    sumrgb = r+g+b
    nzerosumrgb = sumrgb != 0
    
    nr = np.zeros(r.shape, dtype=r.dtype)
    ng = np.zeros(g.shape, dtype=g.dtype)
    nb = np.zeros(b.shape, dtype=b.dtype)
    
    nr[nzerosumrgb] = r[nzerosumrgb]/sumrgb[nzerosumrgb]
    ng[nzerosumrgb] = g[nzerosumrgb]/sumrgb[nzerosumrgb]
    nb[nzerosumrgb] = b[nzerosumrgb]/sumrgb[nzerosumrgb]
    
    return compose(nr, ng, nb)
    

def rgb_to_hls(rgb):
    r,g,b = decompose(rgb)
    #r = rgb[...,0]
    #g = rgb[...,1]
    #b = rgb[...,2]
    
    high = np.amax(rgb, axis=2)
    low = np.amin(rgb, axis=2)
    
    delta = high-low
    hlsum = high+low
    
    zerodelta = delta == 0
    
    max_r = high == r
    max_g = high == g
    max_b = high == b
    
    L = (hlsum)/2
    lowl = L <= 0.5
    highl = ~lowl
    
    h = np.zeros(high.shape, 'float')
    s = np.zeros(high.shape, 'float')
    rc = np.zeros(high.shape, 'float')
    gc = np.zeros(high.shape, 'float')
    bc = np.zeros(high.shape, 'float')
    
    s[zerodelta] = 0
    s[lowl & ~zerodelta] = delta[lowl & ~zerodelta]/hlsum[lowl & ~zerodelta]
    s[highl] = delta[highl]/(2-delta[highl])
    
    rc[zerodelta] = 0
    gc[zerodelta] = 0
    bc[zerodelta] = 0

    rc[~zerodelta] = (high[~zerodelta]-r[~zerodelta]) / delta[~zerodelta]
    gc[~zerodelta] = (high[~zerodelta]-g[~zerodelta]) / delta[~zerodelta]
    bc[~zerodelta] = (high[~zerodelta]-b[~zerodelta]) / delta[~zerodelta]
    
    h[zerodelta] = 0
    h[max_r] = bc[max_r]-gc[max_r]
    h[max_g] = 2.0+rc[max_g]-bc[max_g]
    h[max_b] = 4.0+gc[max_b]-rc[max_b]
    
    h = (h/6.0) % 1.0
    
    #hls = np.zeros(rgb.shape, 'float')
    #hls[..., 0] = h
    #hls[..., 1] = L
    #hls[..., 2] = s
    hls = compose(h, L, s)
    
    
    return hls

def hls_to_rgb(hls):
    h = hls[...,0]
    L = hls[...,1]
    s = hls[...,2]
    
    r = np.zeros(h.shape, 'float')
    g = np.zeros(h.shape, 'float')
    b = np.zeros(h.shape, 'float')
    m2 = np.zeros(h.shape, 'float')
    m1 = np.zeros(h.shape, 'float')
    
    zerosaturation = s == 0
    lowl = L <= 0.5
    highl = ~lowl
    
    
    m2[lowl] = L[lowl] * (1.0+s[lowl])
    m2[highl] =  L[highl]+s[highl]-(L[highl]*s[highl])
    
    m1 = 2.0*L - m2
    
    r = _v(m1, m2, h+ONE_THIRD)
    g = _v(m1, m2, h)
    b = _v(m1, m2, h-ONE_THIRD)
    
    r[zerosaturation] = g[zerosaturation] = b[zerosaturation] = L[zerosaturation]
    
    
    rgb = np.zeros(hls.shape, 'float')
    rgb[..., 0] = r
    rgb[..., 1] = g
    rgb[..., 2] = b
    
    return rgb

def _v(m1, m2, hue):
    ret = np.zeros(hue.shape, 'float')
    hue = hue % 1.0
    
    lowonesixty = hue < ONE_SIXTH
    lowhalf = hue < 0.5
    lowtwothird = hue < TWO_THIRD

    ret = m1.copy()
    ret[lowtwothird] = m1[lowtwothird] + (m2[lowtwothird]-m1[lowtwothird])*(TWO_THIRD-hue[lowtwothird])*6.0
    ret[lowhalf] = m2[lowhalf]
    ret[lowonesixty] = m1[lowonesixty] + (m2[lowonesixty]-m1[lowonesixty])*hue[lowonesixty]*6.0
    
    return ret

def mt_li_espectral(rgb_img, vec=None):
    # Estimated vec using groundtruth and scipy.optimize.fmin(mt_li_espectral_gt):
    if vec is None:
        vec = np.array([1.74338887e-02,3.07998404e-01,2.33813449e-02,1.01736022e+00,-5.85913070e-04,
                7.16921436e-01,2.05789315e-02,1.05391177e+00,6.37990951e-02,6.51417819e-01,
                -3.37627294e-06,4.70837722e-01,2.66144311e-01,2.84518650e-01,3.80010333e-01,5.74782186e-01,
                -4.39486595e-04,3.52373078e-01])
    
    
    
    rgb = rgb_img.copy()
    hsv = color.rgb2hsv(rgb)
    nrgb = normalize_rgb(rgb)
    
    h,s,v = decompose(hsv)
    
    k = -1
    
    h  = (h >= vec[k + 1]) & (h <= (vec[k + 1]+vec[k + 2]))
    s  = (s >= vec[k + 3]) & (s <= (vec[k + 3]+vec[k + 4]))
    v  = (v >= vec[k + 5]) & (v <= (vec[k + 5]+vec[k + 6]))
    
    r,g,b = decompose(rgb)
    
    r  = (r >= vec[k + 7]) & (r <= (vec[k + 7]+vec[k + 8]))
    g  = (g >= vec[k + 9]) & (g <= (vec[k + 9]+vec[k + 10]))
    b  = (b >= vec[k + 11]) & (b <= (vec[k + 11]+vec[k + 12]))
    
    nr,ng,nb = decompose(nrgb)
    
    nr  = (nr >= vec[k + 13]) & (nr <= (vec[k + 13]+vec[k + 14]))
    ng  = (ng >= vec[k + 15]) & (ng <= (vec[k + 15]+vec[k + 16]))
    nb  = (nb >= vec[k + 17]) & (nb <= (vec[k + 17]+vec[k + 18]))
    
    return r & g & b & h & s & v & nr & ng & nb

def overlay_mask(rgb_img, bw_mask):
    coef = 1
    p2, p98 = np.percentile(rgb_img, (0, 70))
    rgb_img[..., 0] = rgb_img[..., 0]*((0-bw_mask+coef)/(1+coef))
    rgb_img[..., 1] = rgb_img[..., 1]*((bw_mask+coef)/(1+coef))
    #rgb_img[..., 2] = rgb_img[..., 2]*((~bw_mask+coef)/(1+coef))
    rgb_img[..., 2] = rgb_img[..., 2]*((1-bw_mask+coef)/(1+coef))
    rgb_img = exposure.rescale_intensity(rgb_img, in_range=(p2, p98))
    return rgb_img
