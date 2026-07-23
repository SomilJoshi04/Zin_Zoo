const fs = require('fs');

const path = 'c:\\Users\\hp\\Desktop\\GitDeployee\\Zin_Zoo\\backend\\src\\modules\\food\\admin\\services\\admin.service.js';
let content = fs.readFileSync(path, 'utf-8');

const search = "const targetFoodType = body.foodType !== undefined ? (body.foodType === 'Veg' ? 'Veg' : 'Non-Veg') : \n(doc.foodType === 'Veg' ? 'Veg' : 'Non-Veg');";
const search_cr = "const targetFoodType = body.foodType !== undefined ? (body.foodType === 'Veg' ? 'Veg' : 'Non-Veg') : \r\n(doc.foodType === 'Veg' ? 'Veg' : 'Non-Veg');";

const insert = 
    if (restaurant.restaurantType === 'Veg' && targetFoodType === 'Non-Veg') {
        throw new ValidationError('Non-Veg items cannot be added to a Veg restaurant.');
    }
    if (restaurant.restaurantType === 'Non-Veg' && targetFoodType === 'Veg') {
        throw new ValidationError('Veg items cannot be added to a Non-Veg restaurant.');
    };

if (content.includes(search)) {
    content = content.replace(search, search + insert);
} else if (content.includes(search_cr)) {
    content = content.replace(search_cr, search_cr + insert);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Done');
