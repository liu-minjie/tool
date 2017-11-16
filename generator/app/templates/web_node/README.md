通用项目脚手架

nginx 配置:
```
比如项目名是project-center， web_node的端口是5300, web_assets的端口是8001
在/usr/local/etc/nginx/nginx.conf里添加下面的映射

location /project-center/ {
    proxy_pass http://127.0.0.1:5300/;
}
location /project-center-assets/ {
    proxy_pass http://127.0.0.1:8001/;
}
```

启动：

```javascript
node bin/www  //本地环境启动, 需要配置NODE_ENV为local

或者

npm start
```
