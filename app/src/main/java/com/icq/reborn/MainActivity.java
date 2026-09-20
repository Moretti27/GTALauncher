package com.icq.reborn;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.media.*;
import android.net.Uri;
import android.os.*;
import android.provider.ContactsContract;
import android.webkit.*;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity{
 WebView w; ValueCallback<Uri[]> fileCb; static final int FILE=43, CONTACTS_REQ=44;
 volatile boolean appForeground=false;
 static final String MSG_CH="icq_retro_messages", CONTACT_CH="icq_retro_contacts", CALL_CH="icq_retro_calls";

 protected void onResume(){super.onResume();appForeground=true;BackgroundSyncReceiver.cancel(this);if(w!=null)w.evaluateJavascript("window.icqForeground&&window.icqForeground()",null);}
 protected void onPause(){appForeground=false;if(w!=null)w.evaluateJavascript("window.icqBackground&&window.icqBackground()",null);String t=getSharedPreferences("icq_reborn",MODE_PRIVATE).getString("token","");if(!t.isEmpty())BackgroundSyncReceiver.schedule(this,true);super.onPause();}
 public void onCreate(Bundle b){
  super.onCreate(b); askBase();
  createChannels();
  w=new WebView(this); setContentView(w);
  WebSettings s=w.getSettings();
  s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
  s.setAllowFileAccess(false); s.setAllowContentAccess(true); s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
  w.setWebViewClient(new WebViewClient(){
   public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
    Uri u=r.getUrl();
    if("https".equals(u.getScheme())&&"icq.local".equals(u.getHost())){
     String p=u.getPath(); if(p==null||p.equals("/")||p.isEmpty())p="/index.html";
     try{
      String a=p.substring(1);
      String mime=a.endsWith(".wav")?"audio/wav":a.endsWith(".png")?"image/png":a.endsWith(".css")?"text/css":a.endsWith(".js")?"application/javascript":"text/html";
      return new WebResourceResponse(mime,mime.startsWith("text")||mime.contains("javascript")?"UTF-8":null,getAssets().open(a));
     }catch(Exception e){}
    }
    return super.shouldInterceptRequest(v,r);
   }
   public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
    Uri u=r.getUrl(); if("https".equals(u.getScheme())&&"icq.local".equals(u.getHost()))return false;
    try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){} return true;
   }
  });
  w.setWebChromeClient(new WebChromeClient(){
   public void onPermissionRequest(PermissionRequest r){
    runOnUiThread(()->{
     List<String>a=new ArrayList<>();
     for(String x:r.getResources()){
      if(PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(x)&&ok(Manifest.permission.RECORD_AUDIO))a.add(x);
      if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(x)&&ok(Manifest.permission.CAMERA))a.add(x);
     }
     if(a.isEmpty())r.deny();else r.grant(a.toArray(new String[0]));
    });
   }
   public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){
    fileCb=cb;try{startActivityForResult(p.createIntent(),FILE);return true;}catch(Exception e){fileCb=null;return false;}
   }
  });
  w.addJavascriptInterface(new Bridge(),"NativeBridge");
  w.loadUrl("https://icq.local/");
 }

 void createChannels(){
  if(Build.VERSION.SDK_INT>=26){
   NotificationManager n=getSystemService(NotificationManager.class);
   NotificationChannel m=new NotificationChannel(MSG_CH,"Сообщения ICQ Reborn",NotificationManager.IMPORTANCE_HIGH);m.setSound(null,null);
   NotificationChannel c=new NotificationChannel(CONTACT_CH,"Контакты ICQ Reborn",NotificationManager.IMPORTANCE_DEFAULT);c.setSound(null,null);
   NotificationChannel call=new NotificationChannel(CALL_CH,"Звонки ICQ Reborn",NotificationManager.IMPORTANCE_HIGH);call.setSound(null,null);
   n.createNotificationChannel(m);n.createNotificationChannel(c);n.createNotificationChannel(call);
  }
 }
 boolean ok(String p){return Build.VERSION.SDK_INT<23||checkSelfPermission(p)==PackageManager.PERMISSION_GRANTED;}
 void askBase(){
  if(Build.VERSION.SDK_INT<23)return;ArrayList<String>m=new ArrayList<>();
  for(String p:new String[]{Manifest.permission.CAMERA,Manifest.permission.RECORD_AUDIO})if(checkSelfPermission(p)!=PackageManager.PERMISSION_GRANTED)m.add(p);
  if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)m.add(Manifest.permission.POST_NOTIFICATIONS);
  if(!m.isEmpty())requestPermissions(m.toArray(new String[0]),42);
 }
 protected void onActivityResult(int r,int c,Intent d){super.onActivityResult(r,c,d);if(r==FILE&&fileCb!=null){fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(c,d));fileCb=null;}}

 void playAsset(String asset){
  try{
   android.content.res.AssetFileDescriptor fd=getAssets().openFd(asset);
   MediaPlayer mp=new MediaPlayer();
   mp.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());
   fd.close();
   mp.setOnCompletionListener(x->{try{x.release();}catch(Exception e){}});
   mp.prepare();mp.start();
  }catch(Exception e){}
 }
 void playRetro(String kind){
  if("auth".equals(kind)){playAsset("sounds/friend_add.mp3");return;}
  if("message".equals(kind)){playAsset("sounds/message.mp3");return;}
  new Thread(()->{
   try{
    double[][] seq;
    if("out".equals(kind))seq=new double[][]{{659,70},{0,25},{880,95}};
    else if("online".equals(kind))seq=new double[][]{{523,70},{0,20},{659,70},{0,20},{988,130}};
    else if("auth".equals(kind))seq=new double[][]{{587,70},{0,20},{784,80},{0,20},{1047,125}};
    else if("startup".equals(kind))seq=new double[][]{{392,80},{0,15},{523,80},{0,15},{659,90},{0,20},{1047,160}};
    else if("call".equals(kind))seq=new double[][]{{740,180},{0,80},{988,180},{0,260},{740,180},{0,80},{988,220}};
    else if("error".equals(kind))seq=new double[][]{{262,110},{0,30},{196,160}};
    else seq=new double[][]{{784,90},{0,25},{1175,120}};
    final int rate=22050; int total=0;for(double[]q:seq)total+=(int)(q[1]*rate/1000.0);
    short[] pcm=new short[total];int pos=0;
    for(double[]q:seq){
     int n=(int)(q[1]*rate/1000.0);double f=q[0];
     for(int i=0;i<n;i++){
      double x=0;
      if(f>0){
       double t=i/(double)rate,env=Math.min(1.0,i/(rate*.018));
       env*=Math.min(1.0,(n-i)/(rate*.12));
       x=(Math.sin(2*Math.PI*f*t)*.78+Math.sin(2*Math.PI*f*2*t)*.22)*env*.28;
      }
      pcm[pos++]=(short)(x*32767);
     }
    }
    AudioTrack a=new AudioTrack(AudioManager.STREAM_NOTIFICATION,rate,AudioFormat.CHANNEL_OUT_MONO,AudioFormat.ENCODING_PCM_16BIT,pcm.length*2,AudioTrack.MODE_STATIC);
    a.write(pcm,0,pcm.length);a.setNotificationMarkerPosition(pcm.length);a.setPlaybackPositionUpdateListener(new AudioTrack.OnPlaybackPositionUpdateListener(){public void onMarkerReached(AudioTrack t){t.release();}public void onPeriodicNotification(AudioTrack t){}});
    a.play();
   }catch(Exception e){}
  }).start();
 }

 void notifyUser(String title,String text,String type){
  runOnUiThread(()->{
   try{
    if(appForeground){playRetro(type);return;}
    if(Build.VERSION.SDK_INT>=33&&!ok(Manifest.permission.POST_NOTIFICATIONS))return;
    playRetro(type);
    Intent i=new Intent(this,MainActivity.class);
    PendingIntent p=PendingIntent.getActivity(this,0,i,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
    String ch="call".equals(type)?CALL_CH:("auth".equals(type)||"online".equals(type)?CONTACT_CH:MSG_CH);
    Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,ch):new Notification.Builder(this);
    b.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle(title).setContentText(text).setAutoCancel(true).setContentIntent(p);
    if(Build.VERSION.SDK_INT<26)b.setSound(null);
    getSystemService(NotificationManager.class).notify((int)(System.currentTimeMillis()%100000),b.build());
   }catch(Exception e){}
  });
 }

 String phoneNumbers(){
  if(!ok(Manifest.permission.READ_CONTACTS))return "[]";
  JSONArray a=new JSONArray();HashSet<String>seen=new HashSet<>();
  try(Cursor c=getContentResolver().query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,new String[]{ContactsContract.CommonDataKinds.Phone.NUMBER},null,null,null)){
   if(c!=null){int ix=c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);while(c.moveToNext()){String n=c.getString(ix);if(n!=null&&seen.add(n))a.put(n);}}
  }catch(Exception e){}
  return a.toString();
 }

 public class Bridge{
  @JavascriptInterface public String prefGet(String key){return getSharedPreferences("icq_reborn",MODE_PRIVATE).getString(key,"");}
  @JavascriptInterface public void prefSet(String key,String value){getSharedPreferences("icq_reborn",MODE_PRIVATE).edit().putString(key,value==null?"":value).apply();}
  @JavascriptInterface public void prefRemove(String key){getSharedPreferences("icq_reborn",MODE_PRIVATE).edit().remove(key).apply();}

  @JavascriptInterface public void copy(String t){runOnUiThread(()->{((android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("ICQ Reborn",t));Toast.makeText(MainActivity.this,"Скопировано",Toast.LENGTH_SHORT).show();});}
  @JavascriptInterface public void share(String t){runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_SEND);i.setType("text/plain");i.putExtra(Intent.EXTRA_TEXT,t);startActivity(Intent.createChooser(i,"Поделиться"));});}
  @JavascriptInterface public void openExternal(String url){runOnUiThread(()->{try{Uri u=Uri.parse(url);String s=u.getScheme();if("http".equalsIgnoreCase(s)||"https".equalsIgnoreCase(s))startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){}});}
  @JavascriptInterface public void toast(String t){runOnUiThread(()->Toast.makeText(MainActivity.this,t,Toast.LENGTH_SHORT).show());}
  @JavascriptInterface public void bg(boolean on){runOnUiThread(()->{if(on)BackgroundSyncReceiver.schedule(MainActivity.this,true);else BackgroundSyncReceiver.cancel(MainActivity.this);});}
  @JavascriptInterface public boolean isForeground(){return appForeground;}
  @JavascriptInterface public String health(String base){
   try{
    URL u=new URL(String.valueOf(base).replaceAll("/+$","")+"/health");
    HttpURLConnection h=(HttpURLConnection)u.openConnection();
    h.setConnectTimeout(1800);h.setReadTimeout(1800);h.setRequestMethod("GET");h.setUseCaches(false);
    int code=h.getResponseCode();if(code<200||code>=300)return "";
    InputStream in=h.getInputStream();ByteArrayOutputStream b=new ByteArrayOutputStream();byte[] x=new byte[4096];int n;
    while((n=in.read(x))>0)b.write(x,0,n);in.close();
    return b.toString(StandardCharsets.UTF_8.name());
   }catch(Exception e){return "";}
  }
  @JavascriptInterface public void healthAsync(String base,String callbackId){
   new Thread(()->{
    String raw=health(base);
    runOnUiThread(()->{
     try{
      if(w!=null)w.evaluateJavascript("window.__nativeHealthResult&&window.__nativeHealthResult("+JSONObject.quote(callbackId)+","+JSONObject.quote(raw)+")",null);
     }catch(Exception e){}
    });
   }).start();
  }
  @JavascriptInterface public void play(String type){playRetro(type);}
  @JavascriptInterface public void notify(String title,String text,String type){notifyUser(title,text,type);}
  @JavascriptInterface public boolean hasContactsPermission(){return ok(Manifest.permission.READ_CONTACTS);}
  @JavascriptInterface public void requestContacts(){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=23&&!ok(Manifest.permission.READ_CONTACTS))requestPermissions(new String[]{Manifest.permission.READ_CONTACTS},CONTACTS_REQ);});}
  @JavascriptInterface public String contacts(){return phoneNumbers();}
  @JavascriptInterface public String listAmneziaProfiles(){
   JSONArray a=new JSONArray();
   try{
    String[] files=getAssets().list("amnezia");
    if(files!=null){Arrays.sort(files);for(String f:files)if(f.toLowerCase(Locale.ROOT).endsWith(".conf"))a.put(f);}
   }catch(Exception e){}
   return a.toString();
  }
  @JavascriptInterface public String readAmneziaProfile(String name){
   try{
    if(name==null||!name.matches("[A-Za-z0-9_.-]+\\.conf"))return "";
    InputStream in=getAssets().open("amnezia/"+name);
    ByteArrayOutputStream b=new ByteArrayOutputStream();byte[] x=new byte[8192];int n;
    while((n=in.read(x))>0)b.write(x,0,n);in.close();
    return b.toString(StandardCharsets.UTF_8.name());
   }catch(Exception e){return "";}
  }
  @JavascriptInterface public String parseAmneziaProfile(String name){
   try{
    String raw=readAmneziaProfile(name);if(raw.isEmpty())return "{}";
    JSONObject root=new JSONObject(),iface=new JSONObject(),peer=new JSONObject();
    root.put("name",name);String section="";
    for(String line:raw.split("\\r?\\n")){
     String t=line.trim();if(t.isEmpty()||t.startsWith("#")||t.startsWith(";"))continue;
     if(t.startsWith("[")&&t.endsWith("]")){section=t.substring(1,t.length()-1);continue;}
     int p=t.indexOf('=');if(p<1)continue;
     String k=t.substring(0,p).trim(),v=t.substring(p+1).trim();
     JSONObject dst="Peer".equalsIgnoreCase(section)?peer:iface;
     dst.put(k,v);
    }
    root.put("interface",iface);root.put("peer",peer);
    root.put("hasPrivateKey",iface.has("PrivateKey"));
    return root.toString();
   }catch(Exception e){return "{}";}
  }
 }
}
