Search.setIndex({docnames:["api/Managers","api/django_website","api/django_website.ImageFilters","api/django_website.ImageProviders","api/django_website.Managers","api/django_website.MapMiners","api/django_website.Primitives","api/django_website.migrations","api/modules","index"],envversion:{"sphinx.domains.c":1,"sphinx.domains.changeset":1,"sphinx.domains.citation":1,"sphinx.domains.cpp":1,"sphinx.domains.javascript":1,"sphinx.domains.math":2,"sphinx.domains.python":1,"sphinx.domains.rst":1,"sphinx.domains.std":1,"sphinx.ext.intersphinx":1,"sphinx.ext.todo":1,"sphinx.ext.viewcode":1,sphinx:56},filenames:["api/Managers.rst","api/django_website.rst","api/django_website.ImageFilters.rst","api/django_website.ImageProviders.rst","api/django_website.Managers.rst","api/django_website.MapMiners.rst","api/django_website.Primitives.rst","api/django_website.migrations.rst","api/modules.rst","index.rst"],objects:{"":{django_website:[1,0,0,"-"]},"django_website.ImageFilters":{GreeneryFilter:[2,0,0,"-"],ImageFilter:[2,0,0,"-"],commonFunctions:[2,0,0,"-"]},"django_website.ImageFilters.GreeneryFilter":{GreeneryFilter:[2,1,1,""]},"django_website.ImageFilters.GreeneryFilter.GreeneryFilter":{filterId:[2,2,1,""],filterName:[2,2,1,""],processImageFromFeatureCollection:[2,3,1,""]},"django_website.ImageFilters.ImageFilter":{ImageFilter:[2,1,1,""]},"django_website.ImageFilters.ImageFilter.ImageFilter":{filterId:[2,2,1,""],filterName:[2,2,1,""],processImageFromFeatureCollection:[2,3,1,""]},"django_website.ImageFilters.commonFunctions":{compose:[2,4,1,""],decompose:[2,4,1,""],hls_to_rgb:[2,4,1,""],mt_li_espectral:[2,4,1,""],normalize2_rgb:[2,4,1,""],normalize_rgb:[2,4,1,""],overlay_mask:[2,4,1,""],rgb_to_hls:[2,4,1,""]},"django_website.ImageProviders":{GoogleStreetViewProvider:[3,0,0,"-"],ImageProvider:[3,0,0,"-"]},"django_website.ImageProviders.GoogleStreetViewProvider":{GoogleStreetViewProvider:[3,1,1,""],Size:[3,1,1,""]},"django_website.ImageProviders.GoogleStreetViewProvider.GoogleStreetViewProvider":{createGeoImageFromStreetViewPanoramaData:[3,3,1,""],getImageForFeatureCollection:[3,3,1,""],imageProviderId:[3,2,1,""],imageProviderName:[3,2,1,""]},"django_website.ImageProviders.ImageProvider":{ImageProvider:[3,1,1,""]},"django_website.ImageProviders.ImageProvider.ImageProvider":{getImageForFeatureCollection:[3,3,1,""],imageProviderId:[3,2,1,""],imageProviderName:[3,2,1,""]},"django_website.LogGenerator":{write_to_log:[1,4,1,""]},"django_website.Managers":{ImageFilterManager:[4,0,0,"-"],ImageProviderManager:[4,0,0,"-"],MapMinerManager:[4,0,0,"-"],UserManager:[4,0,0,"-"]},"django_website.Managers.ImageFilterManager":{ImageFilterManager:[4,1,1,""]},"django_website.Managers.ImageFilterManager.ImageFilterManager":{getAvailableImageFilters:[4,3,1,""],processImageFromFeatureCollection:[4,3,1,""],registerFilter:[4,3,1,""]},"django_website.Managers.ImageProviderManager":{ImageProviderManager:[4,1,1,""]},"django_website.Managers.ImageProviderManager.ImageProviderManager":{ImageProviders:[4,3,1,""],getAvailableImageProviders:[4,3,1,""],getImageForFeatureCollection:[4,3,1,""],registerImageProvider:[4,3,1,""]},"django_website.Managers.MapMinerManager":{MapMinerManager:[4,1,1,""]},"django_website.Managers.MapMinerManager.MapMinerManager":{getAvailableMapMinersAndQueries:[4,3,1,""],registerMapMiner:[4,3,1,""],requestQueryToMapMiner:[4,3,1,""]},"django_website.Managers.UserManager":{UserManager:[4,1,1,""]},"django_website.Managers.UserManager.UserManager":{createUser:[4,3,1,""]},"django_website.MapMiners":{GeoSampaMiner:[5,0,0,"-"],MapMiner:[5,0,0,"-"],OSMMiner:[5,0,0,"-"]},"django_website.MapMiners.GeoSampaMiner":{GeoSampaMiner:[5,1,1,""]},"django_website.MapMiners.GeoSampaMiner.GeoSampaMiner":{mapMinerId:[5,2,1,""],mapMinerName:[5,2,1,""]},"django_website.MapMiners.MapMiner":{MapMiner:[5,1,1,""]},"django_website.MapMiners.MapMiner.MapMiner":{doQuery:[5,3,1,""],getAvailableQueries:[5,3,1,""],mapMinerId:[5,2,1,""],mapMinerName:[5,2,1,""]},"django_website.MapMiners.OSMMiner":{OSMMiner:[5,1,1,""]},"django_website.MapMiners.OSMMiner.OSMMiner":{OverpassAPIStatus:[5,1,1,""],OverpassRunningQuery:[5,1,1,""],inacityorg:[5,2,1,""],mapMinerId:[5,2,1,""],mapMinerName:[5,2,1,""],overpassapi:[5,2,1,""]},"django_website.MapMiners.OSMMiner.OSMMiner.OverpassAPIStatus":{fromText:[5,3,1,""]},"django_website.Primitives":{DTO:[6,0,0,"-"],GeoImage:[6,0,0,"-"],GeoSampa:[6,0,0,"-"],OSMPrimitives:[6,0,0,"-"],Primitives:[6,0,0,"-"]},"django_website.Primitives.DTO":{SimpleDTO:[6,1,1,""]},"django_website.Primitives.DTO.SimpleDTO":{toJSON:[6,3,1,""]},"django_website.Primitives.GeoImage":{CustomJSONEncoder:[6,1,1,""],GeoImage:[6,1,1,""],ProcessedImageData:[6,1,1,""],SimpleDTO:[6,1,1,""]},"django_website.Primitives.GeoImage.CustomJSONEncoder":{"default":[6,3,1,""]},"django_website.Primitives.GeoImage.GeoImage":{fromJSON:[6,3,1,""],imageToBase64JPEG:[6,3,1,""],setProcessedData:[6,3,1,""]},"django_website.Primitives.GeoImage.SimpleDTO":{toJSON:[6,3,1,""]},"django_website.Primitives.GeoSampa":{GeoSampa_BusStops:[6,1,1,""]},"django_website.Primitives.GeoSampa.GeoSampa_BusStops":{DoesNotExist:[6,5,1,""],MultipleObjectsReturned:[6,5,1,""],address:[6,2,1,""],description:[6,2,1,""],id:[6,2,1,""],mpoint:[6,2,1,""],name:[6,2,1,""],objects:[6,2,1,""]},"django_website.Primitives.OSMPrimitives":{OSM3S:[6,1,1,""],OSMNode:[6,1,1,""],OSMObject:[6,1,1,""],OSMRelation:[6,1,1,""],OSMRelationMember:[6,1,1,""],OSMResult:[6,1,1,""],OSMWay:[6,1,1,""]},"django_website.Primitives.OSMPrimitives.OSM3S":{DictToOSM3S:[6,3,1,""],JsonToOSM3S:[6,3,1,""]},"django_website.Primitives.OSMPrimitives.OSMResult":{fromJsonDict:[6,3,1,""],fromJsonString:[6,3,1,""]},"django_website.geofunctions":{flip_geojson_coordinates:[1,4,1,""]},"django_website.load":{run:[1,4,1,""]},"django_website.migrations":{"0001_initial":[7,0,0,"-"]},"django_website.migrations.0001_initial":{Migration:[7,1,1,""]},"django_website.migrations.0001_initial.Migration":{dependencies:[7,2,1,""],initial:[7,2,1,""],operations:[7,2,1,""]},"django_website.models":{FilterResult:[1,1,1,""],GeoImage:[1,1,1,""],JSONEncoder_newdefault:[1,4,1,""],Session:[1,1,1,""]},"django_website.models.FilterResult":{DoesNotExist:[1,5,1,""],MultipleObjectsReturned:[1,5,1,""],density:[1,2,1,""],geoImage:[1,2,1,""],geoImage_id:[1,2,1,""],id:[1,2,1,""],mask:[1,2,1,""],objects:[1,2,1,""],presence:[1,2,1,""]},"django_website.models.GeoImage":{DoesNotExist:[1,5,1,""],MultipleObjectsReturned:[1,5,1,""],featureReference:[1,2,1,""],filterresult_set:[1,2,1,""],id:[1,2,1,""],imageURL:[1,2,1,""],objects:[1,2,1,""],parametersJSON:[1,2,1,""]},"django_website.models.Session":{DoesNotExist:[1,5,1,""],MultipleObjectsReturned:[1,5,1,""],id:[1,2,1,""],objects:[1,2,1,""],sessionName:[1,2,1,""],uimodelJSON:[1,2,1,""],user:[1,2,1,""],user_id:[1,2,1,""]},"django_website.urls":{path:[1,4,1,""],re_path:[1,4,1,""]},django_website:{ImageFilters:[2,0,0,"-"],ImageProviders:[3,0,0,"-"],LogGenerator:[1,0,0,"-"],Managers:[4,0,0,"-"],MapMiners:[5,0,0,"-"],Primitives:[6,0,0,"-"],admin:[1,0,0,"-"],geofunctions:[1,0,0,"-"],load:[1,0,0,"-"],migrations:[7,0,0,"-"],models:[1,0,0,"-"],settings:[1,0,0,"-"],settings_old:[1,0,0,"-"],settings_secret:[1,0,0,"-"],settings_secret_template:[1,0,0,"-"],urls:[1,0,0,"-"],views:[1,0,0,"-"],wsgi:[1,0,0,"-"]}},objnames:{"0":["py","module","Python module"],"1":["py","class","Python class"],"2":["py","attribute","Python attribute"],"3":["py","method","Python method"],"4":["py","function","Python function"],"5":["py","exception","Python exception"]},objtypes:{"0":"py:module","1":"py:class","2":"py:attribute","3":"py:method","4":"py:function","5":"py:exception"},terms:{"0001_initi":[1,8],"23s":6,"96_shp_pontoonibus_point":6,"abstract":[2,3,5],"class":[1,2,3,4,5,6,7],"default":6,"float":6,"int":6,"public":1,"return":[2,3],"static":5,"true":[1,6,7],Bus:6,For:1,GIS:[3,5],The:[2,4],These:[6,9],Used:4,__first__:7,abc:[2,3,5],abl:3,access:1,accessor:1,actual:1,adapt:5,adaptor:4,add:6,addfield:7,address:[6,7],admin:8,advis:1,all:[1,2,3,4,5],allow_nan:6,also:1,ani:[1,5,6],anoth:[1,6],api:[5,9],app_label:7,applic:1,arg:[1,6],attribut:6,auth:7,autofield:7,avail:[2,4,5],back:9,base:[1,2,3,4,5,6,7],belog:6,belong:6,below:1,bool:6,booleanfield:7,both:9,built:1,bw_mask:2,call:4,can:[1,5,6],catalog:[2,5],ch1:2,ch2:2,ch3:2,changeset:6,charfield:7,check:9,check_circular:6,child:1,children:1,classmethod:[2,5,6],client:[4,5],collect:[2,3,5],com:1,combin:1,come:2,command:1,common:[2,3],commonfunct:[1,8],compact:6,compos:2,config:1,construct:5,contain:[1,6,9],content:8,contrib:7,coordin:[1,3],copi:1,copyright:6,core:[1,6],could:1,coupl:3,creat:5,create_forward_many_to_many_manag:1,creategeoimagefromstreetviewpanoramadata:3,createmodel:7,createus:4,custom:1,customjsonencod:6,data:[5,6],databas:5,decim:6,decompos:2,dedic:5,defer:[1,6],defin:[1,6],definit:1,deleg:[1,4],densiti:[1,6,7],depend:7,deploy:1,deprec:3,describ:[2,3],descript:[5,6,7],develop:1,dict:[1,6],dicttoosm3:6,discov:1,django:[1,6,7],djangoproject:1,doc:1,doesnotexist:[1,6],doqueri:5,dto:[1,8],dure:4,dynam:1,element:6,encapsul:4,encod:6,end:[4,9],ensure_ascii:6,epsg:6,equival:[2,3],error:4,exampl:1,except:[1,6],execut:[1,5,6],exist:6,expos:1,fals:6,featur:[2,3,4,5,6],featurecollect:[2,3,4,5],featurerefer:[1,7],field:[1,6,7],file:1,fill:1,filter:[2,4,5],filterid:[2,4,6],filternam:2,filterresult:[1,7],filterresult_set:1,first:[1,6],flip:1,flip_geojson_coordin:1,floatfield:7,foreignkei:[1,7],format:6,forward:1,forwardmanytoonedescriptor:1,forwardonetoonedescriptor:1,framework:1,from:[1,2,4,5,6],fromjson:6,fromjsondict:6,fromjsonstr:6,fromtext:5,front:[4,9],frontend:5,full:1,gener:[1,6],gentl:9,geo:[1,5],geodjango:6,geofunct:8,geograph:5,geoimag:[1,2,3,4,7,8],geoimage_id:1,geojson:[1,2,3,4,5],geometri:[1,6],geosampa:[1,5,8],geosampa_busstop:[6,7],geosampamin:[1,8],get:[3,9],getavailableimagefilt:4,getavailableimageprovid:4,getavailablemapminersandqueri:4,getavailablequeri:5,getimageforfeaturecollect:[3,4],gis:7,googl:3,googlestreetviewprovid:[1,8],greeneri:[2,6],greeneryfilt:[1,4,8],gsv:3,gsvprovid:3,gsvservic:3,have:1,height:3,here:1,hls:2,hls_to_rgb:2,home:3,how:6,http:[1,6],identifi:6,imag:[1,2,3,4,6],imagedata:6,imagefilt:[1,4,8],imagefiltermanag:[1,8],imageprovid:[1,4,8],imageproviderid:[3,4],imageprovidermanag:[1,8],imageprovidernam:3,imagetobase64jpeg:6,imageurl:[1,7],implement:[1,4],inac:5,inacityorg:5,indent:6,index:9,indic:6,info:6,inform:[1,5],initi:[4,7],instanc:1,instanti:4,interfac:[2,3],introduc:1,introduct:9,ispres:6,its:6,javascript:3,json:6,jsondata:6,jsonencod:6,jsonencoder_newdefault:1,jsontoosm3:6,just:6,keep:[1,4,6],kei:[1,4],keyerror:4,kwarg:[1,6],lat:6,later:1,level:1,line:[2,3],list:[1,2,3,4,6],load:[6,8],loggener:8,lon:6,look:9,mainli:9,make:[1,4,5],manag:[1,3,6,8],mani:1,map:5,mapmin:[1,4,8],mapminerid:[4,5],mapminermanag:[1,8],mapminernam:5,mask:[1,7],mat3channel:2,mediat:4,member:6,messag:1,middlewar:1,might:1,migrat:[1,8],miner:5,model:[6,7,8],model_nam:7,modul:[8,9],more:1,most:1,mpoint:[6,7],mt_li_espectr:2,much:6,multi:[2,3],multipleobjectsreturn:[1,6],must:3,name:[1,6,7],ndarrai:6,need:2,node:6,none:[1,2,3,4,5,6],normalize2_rgb:2,normalize_rgb:2,now:3,numpi:6,object:[1,2,3,4,5,6],objectdoesnotexist:[1,6],obtain:5,one:1,openstreetmap:[5,6],oper:7,option:6,org:[5,6],origin:2,osm3:6,osm:[5,6],osmmin:[1,8],osmnod:6,osmobject:6,osmprimit:[1,8],osmrel:6,osmrelationmemb:6,osmresult:6,osmwai:6,other:[4,6],othererror:4,out:1,overlay_mask:2,overpass:5,overpassapi:5,overpassapistatu:5,overpassrunningqueri:5,packag:8,page:9,panorama:6,paramet:6,parametersjson:[1,7],parent:1,pars:6,password:1,path:1,pattern:1,pixel:6,place:1,platform:[4,9],point:[2,3],pointfield:[6,7],pole:6,possibl:5,presenc:[1,7],present:6,primarili:6,primit:[1,3,4,8],process:2,processeddata:6,processeddatadict:6,processedimagedata:6,processimagefromfeaturecollect:[2,4],product:1,project:1,projectionid:6,properti:[2,4,5,6],provid:[3,4],purpos:1,queri:[1,4,5,6],querynam:5,rang:6,re_path:1,read:[1,6],receiv:[2,3],ref:[1,6],regexpattern:1,region:[4,5],regist:[4,5],registerfilt:4,registerimageprovid:4,registermapmin:4,registri:5,relat:[1,2,6,7],related_nam:1,replac:1,repres:[2,5,6],request:4,requestquerytomapmin:4,resolv:1,respons:[4,6],result:6,revers:1,reversemanytoonedescriptor:1,rgb:2,rgb_img:2,rgb_to_hl:2,role:6,rout:1,routepattern:1,run:[1,5],runfcgi:1,runserv:1,sad69:6,same:6,sampa:5,search:9,secur:1,see:1,select:4,self:1,sens:1,separ:6,serial:6,server:[1,6],session:[1,7],sessionnam:[1,7],set:[6,8],setprocesseddata:6,settings_old:8,settings_secret:8,settings_secret_templ:8,shapefil:6,should:[1,4],shp:6,side:1,simpl:6,simpledto:6,singleton:4,size:3,skipkei:6,some:[1,4,5],sort_kei:6,sourc:[1,2,3,4,5,6,7],spatialrefer:6,special:4,specif:[5,6],standard:1,start:9,startproject:1,statu:5,still:2,stop:6,str:[4,5,6],street:3,string:[1,6],strongli:1,subclass:[1,6],submodul:8,subpackag:8,system:5,tag:6,templat:1,text:5,textfield:7,textmessag:5,them:4,thi:[1,2,5,6],time:[1,6],timestamp:6,timestamp_osm_bas:6,tojson:6,topic:1,track:4,transfer:6,type:6,uid:6,uimodeljson:[1,7],uniqu:1,updat:6,urban:1,url:[6,8],used:[1,2,5,6],user:[1,5,6,7],user_id:1,userdata:4,usermanag:[1,8],using:[1,5,9],usual:1,utm:6,uuidfield:7,valu:[1,6],variabl:1,vec:2,verbos:1,version:6,via:1,view:[3,8],visibl:6,wai:6,when:[1,4,6],where:2,whole:1,width:3,wrap:5,wrapper:[1,3,6],write_to_log:1,wsgi:8,wsgi_appl:1,you:[1,9],your:1,zone:6},titles:["Managers package","django_website package","django_website.ImageFilters package","django_website.ImageProviders package","django_website.Managers package","django_website.MapMiners package","django_website.Primitives package","django_website.migrations package","django_website","Welcome to INACITY\u2019s documentation!"],titleterms:{"0001_initi":7,admin:1,commonfunct:2,content:[0,1,2,3,4,5,6,7],django_websit:[1,2,3,4,5,6,7,8],document:9,dto:6,geofunct:1,geoimag:6,geosampa:6,geosampamin:5,googlestreetviewprovid:3,greeneryfilt:2,imagefilt:2,imagefiltermanag:[0,4],imageprovid:3,imageprovidermanag:[0,4],inac:9,indic:9,load:1,loggener:1,manag:[0,4],mapmin:5,mapminermanag:[0,4],migrat:7,model:1,modul:[0,1,2,3,4,5,6,7],osmmin:5,osmprimit:6,packag:[0,1,2,3,4,5,6,7],primit:6,set:1,settings_old:1,settings_secret:1,settings_secret_templ:1,submodul:[0,1,2,3,4,5,6,7],subpackag:1,tabl:9,url:1,usermanag:[0,4],view:1,welcom:9,wsgi:1}})