import fs from 'fs';
import getColors from 'get-image-colors';

const imagePath = 'C:/Users/pc/DEC MILESTONE TRACKER/src/assets/logo.png';

getColors(imagePath).then(colors => {
    console.log("Colors extracted:");
    colors.forEach(color => console.log(color.hex()));
}).catch(err => {
    console.error(err);
});
