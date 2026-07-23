import sys

path = r'c:\Users\hp\Desktop\GitDeployee\Zin_Zoo\backend\src\modules\food\admin\services\admin.service.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

search = "const targetFoodType = body.foodType !== undefined ? (body.foodType === 'Veg' ? 'Veg' : 'Non-Veg') : \n(doc.foodType === 'Veg' ? 'Veg' : 'Non-Veg');"
insert = "\n    if (restaurant.restaurantType === 'Veg' && targetFoodType === 'Non-Veg') {\n        throw new ValidationError('Non-Veg items cannot be added to a Veg restaurant.');\n    }\n    if (restaurant.restaurantType === 'Non-Veg' && targetFoodType === 'Veg') {\n        throw new ValidationError('Veg items cannot be added to a Non-Veg restaurant.');\n    }"

if search in content:
    content = content.replace(search, search + insert)
else:
    search_cr = "const targetFoodType = body.foodType !== undefined ? (body.foodType === 'Veg' ? 'Veg' : 'Non-Veg') : \r\n(doc.foodType === 'Veg' ? 'Veg' : 'Non-Veg');"
    if search_cr in content:
        content = content.replace(search_cr, search_cr + insert)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
