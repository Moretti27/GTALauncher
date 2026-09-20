package com.icq.reborn;

import android.app.*;
import android.content.*;
import android.media.MediaPlayer;
import android.os.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class BackgroundSyncReceiver extends BroadcastReceiver {
 static final int REQ=25051;
 static final long INTERVAL_MS=2*60*1000L;
 static final String MSG_CH="icq_retro_messages", CONTACT_CH="icq_retro_contacts", CALL_CH="icq_retro_calls";

 public static void schedule(Context c, boolean resetCursor){
  try{
   Context a=c.getApplicationContext();
   android.content.SharedPreferences p=a.getSharedPreferences("icq_reborn",Context.MODE_PRIVATE);
   if(resetCursor)p.edit().putLong("lastEventPoll",System.currentTimeMillis()).apply();
   AlarmManager am=(AlarmManager)a.getSystemService(Context.ALARM_SERVICE);
   Intent i=new Intent(a,BackgroundSyncReceiver.class);
   PendingIntent pi=PendingIntent.getBroadcast(a,REQ,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
   long at=SystemClock.elapsedRealtime()+INTERVAL_MS;
   if(Build.VERSION.SDK_INT>=23)am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,at,pi);
   else am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP,at,pi);
  }catch(Exception e){}
 }
 public static void cancel(Context c){
  try{
   AlarmManager am=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
   PendingIntent pi=PendingIntent.getBroadcast(c,REQ,new Intent(c,BackgroundSyncReceiver.class),PendingIntent.FLAG_NO_CREATE|PendingIntent.FLAG_IMMUTABLE);
   if(pi!=null)am.cancel(pi);
  }catch(Exception e){}
 }

 @Override public void onReceive(Context context, Intent intent){
  final PendingResult pr=goAsync();
  new Thread(()->{
   try{poll(context.getApplicationContext());}catch(Exception e){}
   finally{schedule(context,false);pr.finish();}
  }).start();
 }

 static void poll(Context c)throws Exception{
  android.content.SharedPreferences p=c.getSharedPreferences("icq_reborn",Context.MODE_PRIVATE);
  String token=p.getString("token","");
  String base=p.getString("resolvedServer","");
  if(base.isEmpty()){
   try{
    URL cfg=new URL("https://raw.githubusercontent.com/Moretti27/ICQ-REBORN/main/server-config.json?t="+System.currentTimeMillis());
    HttpURLConnection ch=(HttpURLConnection)cfg.openConnection();
    ch.setConnectTimeout(6000);ch.setReadTimeout(6000);ch.setRequestMethod("GET");
    if(ch.getResponseCode()>=200&&ch.getResponseCode()<300){
     JSONObject o=new JSONObject(read(ch.getInputStream()));
     base=o.optString("publicBaseUrl","");
     if(!base.isEmpty())p.edit().putString("resolvedServer",base.replaceAll("/+$","")).apply();
    }
   }catch(Exception ignored){}
  }
  if(token.isEmpty()||base.isEmpty())return;
  long since=p.getLong("lastEventPoll",System.currentTimeMillis());
  URL u=new URL(base.replaceAll("/+$","")+"/api/events?since="+since);
  HttpURLConnection h=(HttpURLConnection)u.openConnection();
  h.setConnectTimeout(8000);h.setReadTimeout(10000);h.setRequestMethod("GET");
  h.setRequestProperty("Authorization","Bearer "+token);
  int code=h.getResponseCode();
  if(code==401){p.edit().remove("token").apply();return;}
  if(code<200||code>=300)return;
  String body=read(h.getInputStream());
  JSONArray arr=new JSONArray(body);
  long max=since;
  for(int i=0;i<arr.length();i++){
   JSONObject e=arr.getJSONObject(i);
   long ts=e.optLong("ts",0);if(ts>max)max=ts;
   showEvent(c,e);
  }
  if(max>since)p.edit().putLong("lastEventPoll",max).apply();
 }

 static String read(InputStream in)throws Exception{
  ByteArrayOutputStream b=new ByteArrayOutputStream();byte[] x=new byte[8192];int n;
  while((n=in.read(x))>0)b.write(x,0,n);
  return b.toString(StandardCharsets.UTF_8.name());
 }

 static void showEvent(Context c,JSONObject e){
  try{
   String type=e.optString("type","");
   JSONObject d=e.optJSONObject("data");if(d==null)d=new JSONObject();
   String title="ICQ Reborn",text="Новое событие",sound="message";
   if("message".equals(type)){
    JSONObject m=d.optJSONObject("message"),from=d.optJSONObject("from");
    title="ICQ Reborn · "+(from!=null?from.optString("nick",m!=null?m.optString("from",""):""):"");
    text=m!=null?m.optString("text",""):"";
    if(text.isEmpty()&&m!=null&&m.optJSONObject("file")!=null)text="Файл: "+m.optJSONObject("file").optString("name","");
   }else if("group-message".equals(type)){
    JSONObject g=d.optJSONObject("group"),m=d.optJSONObject("message");
    title=g!=null?g.optString("name","ICQ Reborn"):"ICQ Reborn";
    text=m!=null?m.optString("text",""):"";
    if(text.isEmpty()&&m!=null&&m.optJSONObject("file")!=null)text="Файл: "+m.optJSONObject("file").optString("name","");
   }else if("contact-added".equals(type)){
    JSONObject user=d.optJSONObject("user");title="ICQ Reborn";text="Новый контакт: "+(user!=null?user.optString("nick",user.optString("uin","")):"");sound="auth";
   }else if("group-added".equals(type)){
    JSONObject g=d.optJSONObject("group");title="ICQ Reborn";text="Добавлена группа: "+(g!=null?g.optString("name",""):"");sound="auth";
   }else return;
   post(c,title,text,sound,(int)(e.optString("id","0").hashCode()));
  }catch(Exception ex){}
 }

 static void ensureChannels(Context c){
  if(Build.VERSION.SDK_INT>=26){
   NotificationManager n=c.getSystemService(NotificationManager.class);
   NotificationChannel m=new NotificationChannel(MSG_CH,"Сообщения ICQ Reborn",NotificationManager.IMPORTANCE_HIGH);m.setSound(null,null);
   NotificationChannel a=new NotificationChannel(CONTACT_CH,"Контакты ICQ Reborn",NotificationManager.IMPORTANCE_DEFAULT);a.setSound(null,null);
   NotificationChannel call=new NotificationChannel(CALL_CH,"Звонки ICQ Reborn",NotificationManager.IMPORTANCE_HIGH);call.setSound(null,null);
   n.createNotificationChannel(m);n.createNotificationChannel(a);n.createNotificationChannel(call);
  }
 }

 static void play(Context c,String kind){
  String asset="message".equals(kind)?"sounds/message.mp3":"auth".equals(kind)?"sounds/friend_add.mp3":null;
  if(asset==null)return;
  try{
   android.content.res.AssetFileDescriptor fd=c.getAssets().openFd(asset);
   MediaPlayer mp=new MediaPlayer();mp.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());fd.close();
   mp.setOnCompletionListener(x->{try{x.release();}catch(Exception e){}});
   mp.prepare();mp.start();
  }catch(Exception e){}
 }

 static void post(Context c,String title,String text,String type,int id){
  try{
   if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
   ensureChannels(c);play(c,type);
   Intent i=new Intent(c,MainActivity.class);i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
   PendingIntent pi=PendingIntent.getActivity(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
   String ch="auth".equals(type)?CONTACT_CH:MSG_CH;
   Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,ch):new Notification.Builder(c);
   b.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle(title).setContentText(text).setAutoCancel(true).setOnlyAlertOnce(true).setContentIntent(pi);
   if(Build.VERSION.SDK_INT<26)b.setSound(null);
   c.getSystemService(NotificationManager.class).notify(id,b.build());
  }catch(Exception e){}
 }
}
