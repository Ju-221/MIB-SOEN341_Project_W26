import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {eq , like} from 'drizzle-orm';
import {db} from '../db/index.js'
import {allergies, dietaryPreferences, recipes} from '../db/schema.js';
import {Request,Response} from 'express'
import { CreateRecipeBody, Difficulty, UpdateRecipeBody } from '../types/index.js';

// muter: temp-storeage, renamed after insert
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`)
})
export const upload = multer({storage});

// Get /api/recipes?title=
export const getAllRecipes =  (req:Request, res :Response) => {
    try {
        const {title} = req.query;
        let result;
        if (title){
            result  =  db.select().from(recipes).where(like(recipes.title, `%${title}%`)).all();
        } else {
            result = db.select().from(recipes).all();
        }

        // parse the json fields
        result = result.map(parseRecipe);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to fetch recipes'});
    }


}

// get /api/recipes/:id
export const getRecipeById = (req : Request,res: Response) => {
    try {
        const recipe = db.select().from(recipes).where(eq(recipes.id, Number(req.params.id))).get();
        if (!recipe) return res.status(404).json({message:'Recipe not found'});
        res.json(parseRecipe(recipe))
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to fettch recipe'});
    }
};

// POST. api/recipes
export const createRecipe = (req: Request<{}, {}, CreateRecipeBody>, res:Response) => {
    try {
        const {title, description, prepTime, cookTime, estimatedCost,difficulty  ,ingredients, steps, categories, allergies, dietaryPreferences} = req.body;
        const createdBy = req.user!.id;
        /*if (!validateIngredients(ingredients)){
            return res.status(400).json({message: "invalid ingredients"})
        }
            */

        const result = db.insert(recipes).values({
            title, description, createdBy,
            prepTime: Number(prepTime),
            cookTime: Number(cookTime),
            estimatedCost: Number(estimatedCost),
            heroImage: null,
            difficulty: difficulty,
            ingredients: typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients),
            steps: typeof steps === 'string' ? steps: JSON.stringify(steps),
            categories: typeof categories === 'string' ? categories : JSON.stringify(categories),
            dietaryPreferences: typeof dietaryPreferences === 'string' ? dietaryPreferences : JSON.stringify(dietaryPreferences),
            allergies: typeof allergies === 'string' ? allergies: JSON.stringify(allergies)
        }).returning().get();
    

    const id = result.id;

    // rename uploaded image to {id}.ext
    let heroImage = null;
    if(req.file) {
        const ext = path.extname(req.file.originalname); // the file extension
        const newName = `${id}${ext}`;
        fs.renameSync(req.file.path,path.join('./uploads', newName));
        heroImage = newName;
        db.update(recipes).set({heroImage}).where(eq(recipes.id, id)).run()
    }

    res.status(201).json(parseRecipe({...result, heroImage}));
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to create recipe'});
    }

};


export const updateRecipe = (req: Request<{ id: string }, {}, UpdateRecipeBody>, res:Response) => {
    try {
        
        const id = Number(req.params.id);
        const existing = db.select().from(recipes).where(eq(recipes.id, id)).get();
        if (!existing) return res.status(404).json({ message: 'Recipe not found'});
        
        const { title, description, prepTime, cookTime, estimatedCost,difficulty ,ingredients, steps, categories, dietaryPreferences, allergies} = req.body;
        const createdBy = req.user!.id;
        if (existing.createdBy !== createdBy) return res.status(403).json({message: 'Unauthorized'});
        

        let heroImage = existing.heroImage;
        if (req.file) {
            if (existing.heroImage) {
                const imagePath = path.join('./uploads',existing.heroImage);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            const ext = path.extname(req.file.originalname);
            const newName = `${id}${ext}`;
            fs.renameSync(req.file.path, path.join('./uploads',newName));
            heroImage = newName;
            
        }

        const updates = {
            ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(prepTime !== undefined && { prepTime: Number(prepTime) }),
      ...(cookTime !== undefined && { cookTime: Number(cookTime) }),
      ...(estimatedCost !== undefined && { estimatedCost: Number(estimatedCost) }),
      ...(ingredients !== undefined && { ingredients: typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients) }),
      ...(steps !== undefined && { steps: typeof steps === 'string' ? steps : JSON.stringify(steps) }),
      ...(categories !== undefined && { categories: typeof categories === 'string' ? categories : JSON.stringify(categories) }),
      ...(dietaryPreferences !== undefined && {dietaryPreferences: typeof dietaryPreferences === 'string' ? dietaryPreferences : JSON.stringify(dietaryPreferences)}),
      ...(allergies !== undefined && {allergies: typeof allergies === 'string' ? allergies : JSON.stringify(allergies)}),
      ...(difficulty !== undefined && { difficulty }),
      heroImage,
    };

    const updated = db.update(recipes).set(updates).where(eq(recipes.id, id)).returning().get();
    res.json(parseRecipe(updated));

    }catch (err) {
        console.error(err);
        res.status(500).json( {message: 'Failed to update the recipe'})
    };
    
}

// Dlete /api/recipes/:id
export const deleteRecipe = (req : Request, res:Response) => {
    try {
        const id = Number(req.params.id);
        const existing = db.select().from(recipes).where(eq(recipes.id,id)).get();
        if (!existing) return res.status(404).json({messsage: 'Recipe not found'});
        const createdBy = req.user!.id;
        if (existing.createdBy !== createdBy) return res.status(403).json({message: 'Unauthorized'});

        if (existing.heroImage){
            const imagePath = path.join('./uploads',existing.heroImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        db.delete(recipes).where(eq(recipes.id, id)).run();
        res.json({message: 'Recipe deleted'})
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to delete recipe'});
    }
};


// helper function 
const parseRecipe = (r : typeof recipes.$inferSelect) => {
    return {
        ...r,
        ingredients: JSON.parse(r.ingredients || '[]'),
        steps: JSON.parse(r.steps || '[]'),
        categories: JSON.parse(r.categories || '[]'),
        dietaryPreferences: JSON.parse(r.dietaryPreferences || '[]'),
        allergies: JSON.parse(r.allergies || '[]')
    };
}

// helper to check that ingredents are valid 
const validateIngredients = (ing: Array<{name: string, amount: number , unit: string}>) => {
    return ing.every(i => ingredients.has(i.name))

}

import { GoogleGenerativeAI} from '@google/generative-ai';
import { error } from 'console';

export const generateRecipe = async (req: Request, res: Response) => {
    try {
        const {prompt} = req.body;
        const createdBy = req.user!.id; // ! asserts that user object is non null

        const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAi.getGenerativeModel({model: 'gemini-2.5-flash' });

        const systemPrompt = `
            Generate a recipe based on: "${prompt}".
            Respond ONLY with valid JSON in this exact shape:
            {
              "title": string,
              "description": string,
              "prepTime": number (minutes),
              "cookTime": number (minutes),
              "estimatedCost": number (dollars),
              "difficulty": "Easy" | "Medium" | "Hard",
              "ingredients": [{ "name": string, "amount": number, "unit": string }],
              "steps": [string],
              "categories": [string]
            }
              all ingrdients must be part of this list : ${[...ingredients].join(', ')}, everythign lowe case
        `;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();

        // strip away the markdown syntax 
        const json = text.replace(/```json|```/g, '').trim();
        const recipe = JSON.parse(json);

        console.log(recipe)

        
        if (!validateIngredients(recipe.ingredients)){
            throw error("invalid ingredients")
        }

        const saved = db.insert(recipes).values({
            title: recipe.title,
            description: recipe.description,
            createdBy,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            estimatedCost: recipe.estimatedCost,
            difficulty: recipe.difficulty,
            ingredients: JSON.stringify(recipe.ingredients),
            steps: JSON.stringify(recipe.steps),
            categories: JSON.stringify(recipe.categories),
            dietaryPreferences: '[]',
            allergies: '[]',
            heroImage: null,
        }).returning().get();


        res.status(201).json(parseRecipe(saved));
        
            
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to generate recipe' });
    }
}

// ingredients
const ingredients = new Set([
  // Vegetables
  "Garlic", "Onion", "Tomato", "Potato", "Carrot", "Celery", "Spinach", "Broccoli",
  "Cauliflower", "Zucchini", "Bell pepper", "Red bell pepper", "Green bell pepper",
  "Yellow bell pepper", "Jalapeño", "Serrano pepper", "Habanero pepper", "Poblano pepper",
  "Cucumber", "Lettuce", "Romaine lettuce", "Iceberg lettuce", "Arugula", "Kale",
  "Swiss chard", "Bok choy", "Cabbage", "Red cabbage", "Brussels sprouts", "Asparagus",
  "Green beans", "Peas", "Edamame", "Corn", "Sweet corn", "Eggplant", "Artichoke",
  "Leek", "Shallot", "Green onion", "Chive", "Fennel", "Beet", "Turnip", "Parsnip",
  "Rutabaga", "Radish", "Daikon", "Jicama", "Kohlrabi", "Okra", "Butternut squash",
  "Acorn squash", "Spaghetti squash", "Pumpkin", "Sweet potato", "Yam", "Taro",
  "Plantain", "Mushroom", "Cremini mushroom", "Portobello mushroom", "Shiitake mushroom",
  "Oyster mushroom", "Button mushroom", "Chanterelle mushroom", "Porcini mushroom",
  "Enoki mushroom", "Maitake mushroom", "Morel mushroom", "Truffle", "Bamboo shoots",
  "Water chestnuts", "Bean sprouts", "Alfalfa sprouts", "Broccoli sprouts", "Watercress",
  "Endive", "Radicchio", "Frisée", "Microgreens", "Snow peas", "Sugar snap peas",

  // Fruits
  "Lemon", "Lime", "Orange", "Grapefruit", "Tangerine", "Mandarin", "Blood orange",
  "Apple", "Granny Smith apple", "Fuji apple", "Gala apple", "Pear", "Peach", "Plum",
  "Apricot", "Cherry", "Blueberry", "Strawberry", "Raspberry", "Blackberry",
  "Cranberry", "Grape", "Red grape", "Green grape", "Mango", "Pineapple", "Papaya",
  "Kiwi", "Banana", "Plantain", "Watermelon", "Cantaloupe", "Honeydew melon",
  "Coconut", "Avocado", "Fig", "Date", "Pomegranate", "Passion fruit", "Guava",
  "Lychee", "Rambutan", "Dragon fruit", "Star fruit", "Persimmon", "Quince",
  "Mulberry", "Elderberry", "Gooseberry", "Currant", "Boysenberry", "Jackfruit",
  "Durian", "Tamarind", "Kumquat", "Clementine", "Ugli fruit", "Nectarine",
  "Plum", "Damson", "Greengage",

  // Proteins - Meat
  "Chicken breast", "Chicken thigh", "Chicken drumstick", "Chicken wing", "Whole chicken",
  "Ground chicken", "Turkey breast", "Ground turkey", "Turkey leg", "Beef steak",
  "Ground beef", "Beef brisket", "Beef short ribs", "Beef chuck", "Beef tenderloin",
  "Ribeye steak", "Sirloin steak", "Flank steak", "Skirt steak", "Hanger steak",
  "Pork chop", "Pork tenderloin", "Pork belly", "Ground pork", "Pork shoulder",
  "Pork ribs", "Bacon", "Pancetta", "Prosciutto", "Ham", "Salami", "Pepperoni",
  "Sausage", "Italian sausage", "Chorizo", "Bratwurst", "Kielbasa", "Andouille",
  "Lamb chop", "Ground lamb", "Leg of lamb", "Lamb shoulder", "Rack of lamb",
  "Veal", "Bison", "Venison", "Duck breast", "Duck leg", "Goose", "Quail",

  // Proteins - Seafood
  "Salmon", "Tuna", "Cod", "Halibut", "Tilapia", "Mahi-mahi", "Swordfish", "Trout",
  "Sea bass", "Snapper", "Grouper", "Flounder", "Sole", "Catfish", "Haddock",
  "Sardine", "Anchovy", "Mackerel", "Herring", "Pollock", "Pangasius", "Barramundi",
  "Shrimp", "Prawn", "Lobster", "Crab", "Dungeness crab", "King crab", "Snow crab",
  "Scallop", "Clam", "Mussel", "Oyster", "Squid", "Octopus", "Cuttlefish",
  "Abalone", "Sea urchin", "Crawfish", "Langoustine",

  // Proteins - Plant & Dairy
  "Egg", "Egg white", "Egg yolk", "Tofu", "Firm tofu", "Silken tofu", "Tempeh",
  "Seitan", "Edamame", "Lentils", "Black beans", "Kidney beans", "Chickpeas",
  "Pinto beans", "Navy beans", "Cannellini beans", "Lima beans", "Fava beans",
  "Soybeans", "Split peas", "Mung beans", "Adzuki beans", "Black-eyed peas",

  // Dairy & Alternatives
  "Milk", "Whole milk", "Skim milk", "2% milk", "Buttermilk", "Heavy cream",
  "Light cream", "Half-and-half", "Sour cream", "Crème fraîche", "Yogurt",
  "Greek yogurt", "Butter", "Unsalted butter", "Ghee", "Cream cheese",
  "Ricotta cheese", "Mozzarella cheese", "Parmesan cheese", "Cheddar cheese",
  "Gruyère cheese", "Swiss cheese", "Brie cheese", "Camembert cheese",
  "Gouda cheese", "Havarti cheese", "Monterey Jack cheese", "Colby cheese",
  "Pepper Jack cheese", "Blue cheese", "Gorgonzola cheese", "Roquefort cheese",
  "Feta cheese", "Goat cheese", "Manchego cheese", "Asiago cheese", "Provolone cheese",
  "Fontina cheese", "Halloumi cheese", "Queso fresco", "Cotija cheese",
  "Condensed milk", "Evaporated milk", "Powdered milk", "Almond milk", "Oat milk",
  "Soy milk", "Coconut milk", "Cashew milk", "Rice milk", "Coconut cream",

  // Grains & Starches
  "All-purpose flour", "Bread flour", "Whole wheat flour", "Cake flour", "Pastry flour",
  "Almond flour", "Coconut flour", "Rice flour", "Cornmeal", "Cornstarch",
  "Tapioca starch", "Arrowroot powder", "Semolina", "Oats", "Rolled oats",
  "Steel-cut oats", "Quinoa", "Brown rice", "White rice", "Jasmine rice",
  "Basmati rice", "Arborio rice", "Wild rice", "Black rice", "Farro", "Barley",
  "Millet", "Buckwheat", "Rye", "Spelt", "Amaranth", "Sorghum", "Teff",
  "Polenta", "Grits", "Bread crumbs", "Panko bread crumbs", "Pasta", "Spaghetti",
  "Penne", "Rigatoni", "Fusilli", "Farfalle", "Linguine", "Fettuccine", "Lasagna",
  "Orzo", "Couscous", "Egg noodles", "Ramen noodles", "Udon noodles", "Soba noodles",
  "Rice noodles", "Glass noodles", "Tortilla", "Flour tortilla", "Corn tortilla",
  "Pita bread", "Naan", "Brioche", "Sourdough bread", "Baguette",

  // Oils & Fats
  "Olive oil", "Extra virgin olive oil", "Vegetable oil", "Canola oil", "Sunflower oil",
  "Coconut oil", "Sesame oil", "Avocado oil", "Peanut oil", "Grapeseed oil",
  "Walnut oil", "Flaxseed oil", "Truffle oil", "Chili oil", "Lard", "Shortening",
  "Margarine", "Cooking spray",

  // Herbs (Fresh & Dried)
  "Basil", "Fresh basil", "Dried basil", "Parsley", "Fresh parsley", "Dried parsley",
  "Cilantro", "Mint", "Fresh mint", "Dried mint", "Thyme", "Fresh thyme", "Dried thyme",
  "Rosemary", "Fresh rosemary", "Dried rosemary", "Oregano", "Fresh oregano",
  "Dried oregano", "Sage", "Fresh sage", "Dried sage", "Tarragon", "Dill", "Fresh dill",
  "Dried dill", "Chervil", "Marjoram", "Lemon thyme", "Bay leaf", "Lemongrass",
  "Kaffir lime leaves", "Curry leaves", "Epazote", "Lovage", "Savory", "Lavender",
  "Shiso", "Perilla",

  // Spices
  "Salt", "Black pepper", "White pepper", "Red pepper flakes", "Cayenne pepper",
  "Paprika", "Smoked paprika", "Cumin", "Coriander", "Turmeric", "Cinnamon",
  "Nutmeg", "Cloves", "Cardamom", "Allspice", "Star anise", "Fennel seeds",
  "Mustard seeds", "Caraway seeds", "Celery seeds", "Poppy seeds", "Sesame seeds",
  "Fenugreek", "Sumac", "Za'atar", "Garam masala", "Curry powder", "Chili powder",
  "Onion powder", "Garlic powder", "Dried ginger", "Saffron", "Vanilla bean",
  "Anise", "Mace", "Juniper berries", "Pink peppercorns", "Szechuan peppercorns",
  "Annatto", "Asafoetida", "Galangal", "Lemon pepper", "Smoked salt", "Sea salt",
  "Kosher salt", "Himalayan pink salt", "Fleur de sel",

  // Condiments & Sauces
  "Soy sauce", "Tamari", "Fish sauce", "Worcestershire sauce", "Hot sauce", "Tabasco",
  "Sriracha", "Hoisin sauce", "Oyster sauce", "Teriyaki sauce", "Coconut aminos",
  "Miso paste", "White miso", "Red miso", "Tahini", "Harissa", "Gochujang",
  "Sambal oelek", "Chili garlic sauce", "Ponzu sauce", "Rice vinegar", "White vinegar",
  "Apple cider vinegar", "Red wine vinegar", "White wine vinegar", "Balsamic vinegar",
  "Sherry vinegar", "Champagne vinegar", "Malt vinegar", "Ketchup", "Mustard",
  "Dijon mustard", "Whole grain mustard", "Yellow mustard", "Mayonnaise", "Aioli",
  "Ranch dressing", "Caesar dressing", "Italian dressing", "Balsamic glaze",
  "Tomato paste", "Tomato sauce", "Marinara sauce", "Pesto", "Salsa", "Guacamole",
  "Hummus", "Tzatziki", "Chimichurri", "Romesco", "Hollandaise sauce", "Béarnaise sauce",
  "Barbecue sauce", "Buffalo sauce", "Teriyaki glaze", "Plum sauce", "Sweet chili sauce",

  // Sweeteners & Sugar
  "Granulated sugar", "Brown sugar", "Light brown sugar", "Dark brown sugar",
  "Powdered sugar", "Raw sugar", "Turbinado sugar", "Coconut sugar", "Honey",
  "Maple syrup", "Agave nectar", "Molasses", "Corn syrup", "Light corn syrup",
  "Dark corn syrup", "Simple syrup", "Stevia", "Monk fruit sweetener", "Erythritol",
  "Xylitol", "Date syrup", "Barley malt syrup", "Rice syrup",

  // Baking
  "Baking powder", "Baking soda", "Active dry yeast", "Instant yeast", "Cream of tartar",
  "Gelatin", "Agar-agar", "Pectin", "Cocoa powder", "Dutch-process cocoa",
  "Dark chocolate", "Milk chocolate", "White chocolate", "Chocolate chips",
  "Semisweet chocolate", "Bittersweet chocolate", "Unsweetened chocolate",
  "Vanilla extract", "Almond extract", "Peppermint extract", "Lemon extract",
  "Orange extract", "Rose water", "Orange blossom water", "Sprinkles",
  "Food coloring", "Matcha powder",

  // Nuts & Seeds
  "Almonds", "Walnuts", "Pecans", "Cashews", "Pistachios", "Hazelnuts", "Macadamia nuts",
  "Brazil nuts", "Pine nuts", "Peanuts", "Sunflower seeds", "Pumpkin seeds",
  "Flaxseeds", "Chia seeds", "Hemp seeds", "Sesame seeds", "Poppy seeds",
  "Almond butter", "Peanut butter", "Cashew butter", "Sunflower butter",
  "Tahini", "Coconut flakes", "Shredded coconut",

  // Alcohol & Wine (for cooking)
  "White wine", "Red wine", "Dry sherry", "Marsala wine", "Port wine", "Madeira wine",
  "Beer", "Stout", "Lager", "Sake", "Mirin", "Brandy", "Cognac", "Bourbon",
  "Whiskey", "Rum", "Vodka", "Gin", "Vermouth", "Grand Marnier", "Kahlúa",
  "Amaretto", "Triple sec",

  // Broths & Stocks
  "Chicken broth", "Beef broth", "Vegetable broth", "Fish stock", "Bone broth",
  "Dashi", "Miso broth", "Clam juice", "Chicken stock", "Beef stock",

  // Canned & Preserved
  "Canned tomatoes", "Diced tomatoes", "Crushed tomatoes", "Sun-dried tomatoes",
  "Canned chickpeas", "Canned black beans", "Canned kidney beans", "Canned lentils",
  "Canned tuna", "Canned salmon", "Canned sardines", "Canned anchovies",
  "Canned coconut milk", "Roasted red peppers", "Capers", "Olives", "Green olives",
  "Kalamata olives", "Artichoke hearts", "Pickles", "Dill pickles", "Cornichons",
  "Jalapeño slices", "Kimchi", "Sauerkraut", "Mango chutney", "Apple butter",
  "Pumpkin purée", "Canned corn", "Canned peas",

  // Dry Goods & Pantry
  "Lentils", "Green lentils", "Red lentils", "French lentils", "Dried chickpeas",
  "Dried black beans", "Dried kidney beans", "Dried navy beans", "Dried pinto beans",
  "Dried cannellini beans", "Dried split peas", "Potato starch", "Xanthan gum",
  "Nutritional yeast", "Dried mushrooms", "Dried cranberries", "Dried apricots",
  "Dried figs", "Dried dates", "Raisins", "Golden raisins", "Dried cherries",
  "Dried blueberries", "Dried mango", "Prunes",

  // Fresh Aromatics & Specialty
  "Fresh ginger", "Ginger root", "Galangal", "Turmeric root", "Horseradish",
  "Wasabi", "Lemon zest", "Orange zest", "Lime zest", "Lemon juice", "Lime juice",
  "Orange juice", "Apple juice", "Pomegranate juice", "Tomato juice",
  "Vegetable juice", "Coconut water",

  // More Vegetables
  "Napa cabbage", "Savoy cabbage", "Purple cabbage", "Baby spinach", "Baby kale",
  "Collard greens", "Mustard greens", "Dandelion greens", "Beet greens", "Turnip greens",
  "Rainbow chard", "Baby arugula", "Mizuna", "Tatsoi", "Pea shoots",
  "Garlic scapes", "Ramps", "Fiddlehead ferns", "Sunchoke", "Celeriac",
  "Salsify", "Cardoon", "Yuca", "Malanga", "Lotus root", "Bitter melon",
  "Chayote", "Calabaza", "Delicata squash", "Kabocha squash", "Hubbard squash",
  "Yellow squash", "Pattypan squash", "Ghost pepper", "Thai chili", "Anaheim pepper",
  "Banana pepper", "Cherry tomato", "Roma tomato", "Heirloom tomato", "Grape tomato",
  "Beefsteak tomato", "Green tomato", "Tomatillo", "Nopales", "Purslane",

  // More Fruits
  "Rainier cherry", "Bing cherry", "Morello cherry", "Honeycrisp apple",
  "McIntosh apple", "Pink Lady apple", "Bosc pear", "Anjou pear", "Bartlett pear",
  "Asian pear", "Seckel pear", "Yellow peach", "White peach", "Donut peach",
  "Yellow plum", "Black plum", "Italian plum", "Greengage plum", "Damson plum",
  "Navel orange", "Valencia orange", "Cara cara orange", "Satsuma", "Pomelo",
  "Meyer lemon", "Eureka lemon", "Key lime", "Persian lime", "Finger lime",
  "Calamondín", "Feijoa", "Cherimoya", "Soursop", "Mamey sapote", "Sapodilla",
  "Black sapote", "Atemoya", "Jabuticaba", "Miracle fruit", "Açaí", "Camu camu",

  // More Proteins
  "Chicken liver", "Chicken heart", "Beef liver", "Beef heart", "Bone marrow",
  "Oxtail", "Beef tongue", "Tripe", "Sweetbreads", "Foie gras", "Duck confit",
  "Smoked salmon", "Smoked trout", "Smoked mackerel", "Smoked herring",
  "Canned mackerel", "Salt cod", "Dried shrimp", "Fish cake", "Surimi",
  "Imitation crab", "Uni", "Tobiko", "Masago", "Ikura", "Bottarga",
  "Rabbit", "Goat", "Wild boar", "Elk", "Moose", "Bear", "Alligator",

  // More Cheese & Dairy
  "Burrata cheese", "Stracciatella", "Paneer", "Labneh", "Quark",
  "Fromage blanc", "Mascarpone", "Clotted cream", "Dulce de leche",
  "Cajeta", "Crème anglaise", "Custard", "Whipped cream", "Chantilly cream",
  "Kefir", "Ayran", "Lassi", "Skyr", "Fromage frais", "Emmental cheese",
  "Raclette cheese", "Taleggio cheese", "Époisses", "Limburger cheese",
  "Muenster cheese", "Appenzeller cheese", "Comté cheese", "Beaufort cheese",

  // More Grains & Pasta
  "Freekeh", "Kamut", "Einkorn", "Emmer", "Wheat berries", "Rye berries",
  "Oat groats", "Hominy", "Masa harina", "Corn flour", "Chickpea flour",
  "Cassava flour", "Sorghum flour", "Tapioca flour", "Potato flour",
  "Hazelnut flour", "Walnut flour", "Tigernut flour", "Lupin flour",
  "Angel hair pasta", "Bucatini", "Ditalini", "Macaroni", "Cavatappi",
  "Gemelli", "Orecchiette", "Pappardelle", "Tagliatelle", "Strozzapreti",
  "Paccheri", "Trofie", "Maltagliati", "Mafaldine", "Lumache",
  "Wonton wrappers", "Dumpling wrappers", "Spring roll wrappers", "Rice paper",
  "Phyllo dough", "Puff pastry", "Pie crust", "Graham crackers",

  // More Spices & Blends
  "Ras el hanout", "Baharat", "Berbere", "Dukkah", "Shawarma spice",
  "Old Bay seasoning", "Cajun seasoning", "Creole seasoning", "Herbes de Provence",
  "Italian seasoning", "Chinese five-spice", "Japanese seven spice", "Togarashi",
  "Furikake", "Nori flakes", "Bonito flakes", "Dried lavender", "Dried rose petals",
  "Dried hibiscus", "Dried chamomile", "Vanilla powder", "Espresso powder",
  "Carob powder", "Maca powder", "Spirulina", "Wheatgrass powder", "Moringa powder",
  "Activated charcoal", "Butterfly pea flower", "Beetroot powder",

  // More Condiments & Sauces
  "Tahini sauce", "Baba ganoush", "Muhammara", "Skordalia", "Taramasalata",
  "Tonnato sauce", "Salsa verde", "Salsa roja", "Mole sauce", "Adobo sauce",
  "Recado rojo", "Sofrito", "Persillade", "Gremolata", "Pistou", "Tapenade",
  "Anchoiade", "Rouille", "Skordalia", "Chermoula", "Zhug", "Schug",
  "Toum", "Muhammara", "Ajvar", "Ljutenica", "Pindjur", "Kyopolou",
  "Sobrasada", "Nduja", "Lardo", "Guanciale", "Speck", "Coppa",
  "Bresaola", "Mortadella", "Finocchiona", "Cacciatore", "Cervelat",

  // Sweeteners & Extracts
  "Lavender syrup", "Rose syrup", "Elderflower cordial", "Grenadine",
  "Orgeat syrup", "Falernum", "Cane syrup", "Birch syrup", "Sorghum syrup",
  "Yacon syrup", "Lucuma powder", "Mesquite powder", "Carob syrup",
  "Tamarind paste", "Amchur powder", "Kokum",

  // More Nuts & Seeds
  "Black sesame seeds", "White sesame seeds", "Flaxseed meal", "Hemp hearts",
  "Sacha inchi seeds", "Watermelon seeds", "Lotus seeds", "Acorns",
  "Chestnuts", "Ginkgo nuts", "Candlenuts", "Baru nuts", "Mongongo nuts",
  "Tigernut", "Pili nuts", "Paradise nuts",

  // Fermented & Specialty
  "Kombucha", "Kvass", "Tepache", "Water kefir", "Rejuvelac", "Jun tea",
  "Tempeh", "Natto", "Miso", "Doenjang", "Gochujang", "Dobanjiang",
  "Tianmianjiang", "Shrimp paste", "Fermented black beans", "Preserved lemon",
  "Fermented garlic", "Black garlic", "Pickled ginger", "Umeboshi", "Furikake",

  // Teas & Coffees (cooking use)
  "Earl Grey tea", "Matcha", "Hojicha", "Jasmine tea", "Oolong tea",
  "Chai spice", "Espresso", "Cold brew coffee", "Coffee extract",
  "Chicory", "Carob",

  // Waters & Liquids
  "Aquafaba", "Vegetable stock", "Mushroom stock", "Shrimp stock",
  "Lobster stock", "Corn stock", "Smoked water", "Sparkling water",
  "Mineral water", "Rosewater concentrate", "Kewra water"
].map(i => i.toLowerCase()));

export default ingredients;