import axios from "axios";

const http = axios.create({
  proxy: {
    host: "0.0.0.0",
    port: 1087
  }
});

// test proxy
http.get("http://ip.axetroy.xyz").then(res => {
  console.log(res.data);
});
