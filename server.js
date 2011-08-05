var http  = require('http')
  , spawn = require('child_process').spawn
  , path  = require('path');

function run_local_hook(hook_name, data){
  console.log(data);
  hook_path = __dirname + '/hooks/' + hook_name;
  if (path.existsSync(hook_path)) {
    var gh_data = null,
        args = [];
    if (data.length > 0){
      console.log(data);
      try {
       var gh_data = JSON.parse(data.toString());
      } catch (e){
        console.error('Bad JSON input');
      }
    }
    if (gh_data){
      try {
        args = ['--branch', gh_data.ref.replace('refs/heads/', ''), '--repo', gh_data.repository['name']];
      } catch (e) {
        console.error('Bad commit data provided!')
      }
    }
    console.log('Running ' + hook_name + ' @ ' + (new Date()));
    var hook_script = spawn(hook_path, args);
    hook_script.stdin.write(data);
    hook_script.stdout.on('data', function(data){ console.log(data.toString('ascii')); });
    hook_script.stderr.on('data', function(data){ console.error(data.toString('ascii')); });
    hook_script.on('close', function(){
      console.log("\n");
    });
  } else {
    console.error('Cannot open hook for ' + hook_name);
  }
}

function handle_request(req, res, data){
  if (req.method == 'POST' && req.url.length > 1){
    
      run_local_hook(req.url.substr(1), data);
    
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('ok\n');
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('An error occured processing the hook.');
  }
}

port = (process.length > 2) ? process.argv[2] : 4242;
http.createServer(function(req, res){
  buf = '';
  req.on('data', function(data){
    buf += data;
  });
  req.on('end', function(){
    handle_request(req, res, buf);
  });
}).listen(port, "127.0.0.1");

console.log('Github Receive server running at http://127.0.0.1:' + port + '/');