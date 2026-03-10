import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('c:\\Users\\pc\\DEC MILESTONE TRACKER\\Performance Quality.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(function (error) {
    console.error(error);
});
