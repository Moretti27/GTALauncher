package com.icq.reborn;
import android.app.*;import android.content.*;import android.os.*;
public class P2PForegroundService extends Service{
 static final String CH="icq_reborn"; public void onCreate(){super.onCreate();if(Build.VERSION.SDK_INT>=26){NotificationManager n=getSystemService(NotificationManager.class);n.createNotificationChannel(new NotificationChannel(CH,"ICQ Reborn",NotificationManager.IMPORTANCE_LOW));}Intent i=new Intent(this,MainActivity.class);PendingIntent p=PendingIntent.getActivity(this,0,i,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CH):new Notification.Builder(this);b.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle("ICQ Reborn").setContentText("Соединение с сервером активно").setOngoing(true).setContentIntent(p);startForeground(7001,b.build());}
 public int onStartCommand(Intent i,int f,int id){return START_STICKY;} public IBinder onBind(Intent i){return null;}
}
