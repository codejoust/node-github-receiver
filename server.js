var http  = require('http')
  , spawn = require('child_process').spawn
  , path  = require('path');

function run_local_hook(hook_name, params){
  hook_path = __dirname + '/hooks/' + hook_name;
  if (path.existsSync(hook_path)) {
    var gh_data = null,
        args = [];
    if ('payload' in params){
      try {
       var gh_data = JSON.parse(params['payload']);
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
    hook_script.stdout.pipe(process.stdout);
    hook_script.stderr.pipe(process.stderr);
    hook_script.on('close', function(){ console.log("\n"); });
    if ('payload' in params){
      hook_script.stdin.write(params['payload']);
    }
  } else {
    console.error('Cannot open hook for ' + hook_name);
  }
}

function parse_params(raw_data){
  var parts = raw_data.split('&'),
      params = {};
  parts.forEach(function(part){
    part = part.split('=');
    if (part.length == 2){
      params[part[0]] = decodeURIComponent(part[1]);
    }
  });
  return params;
}

function handle_request(req, res, data){
  if (req.method == 'POST' && req.url.length > 1){
      run_local_hook(req.url.substr(1), parse_params(data.toString()));
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('ok\n');
  } else {
    res.writeHead(500, {'Content-Type': 'text/plain'});
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