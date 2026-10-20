/**
 * AI INTEGRATION BOUNDARY
 * -----------------------
 * Every export here is a mock implementation with a realistic async shape.
 * Swap the bodies for real API/server-function calls without touching the UI.
 */

import {
  DETECTABLE,
  priorityFromDays,
  statusFromDays,
  type CookTime,
  type CookingWindow,
  type Cuisine,
  type Ingredient,
  type Recipe,
  type RescueRecipe,
} from "./fridge-data";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SCAN_STAGES = [
  "Identifying ingredients…",
  "Estimating freshness…",
  "Building your inventory…",
];

export const GENERATION_STAGES = (names: string[]) => [
  `Checking what needs rescuing…`,
  `Prioritizing ${names[0] ?? "your ingredients"}…`,
  `Adding ${names[1] ?? "fresh produce"}…`,
  "Matching your cooking time…",
  "Building your Rescue Meals…",
];

/**
 * PHASE 2: Now routes to the Gemini server function.
 * Falls back to mock data if Gemini is unavailable.
 * Returns only the mock Ingredient[] shape for backwards compat.
 * UploadScanner now calls analyzeGroceryPhotoForReview() instead for Phase 2 flow.
 */
export async function analyzeGroceryPhoto(_file?: File | null): Promise<Ingredient[]> {
  await wait(2600);
  const count = 3 + Math.floor(Math.random() * 2);
  return DETECTABLE.slice(0, count).map((i) => ({ ...i }));
}

/** Replace with a real LLM call: inventory + window -> recipe. (Legacy single-recipe shape) */
export async function generateRescueMeal(
  inventory: Ingredient[],
  window: CookingWindow,
): Promise<Recipe> {
  await wait(3200);
  const picks = inventory.filter((i) => !i.rescued).slice(0, 3);
  const names = picks.map((p) => p.name);
  const title = titleFor(names);

  return {
    title,
    time: "Ready in 20 minutes",
    window: window.detail,
    rescued: names,
    why: `${names[0] ?? "These items"} and ${names[1] ?? "the rest"} have the shortest freshness windows in your inventory, so FridgePulse prioritized them for ${window.label.toLowerCase()}.`,
    steps: [
      `Prep ${names[0] ?? "your protein"} and season generously.`,
      `Sear over medium-high heat, then fold in ${names[1] ?? "the greens"}.`,
      `Finish with ${names[2] ?? "a fresh topping"} and serve warm.`,
    ],
  };
}

/**
 * Generate 3 rescue recipes from the wizard selections.
 * Replace this body with a real server-function call in Phase 2.
 */
export async function generateRescipesMock(
  selectedIngredients: Ingredient[],
  cookTime: CookTime,
  cuisine: Cuisine,
  cookingWindow: CookingWindow,
): Promise<RescueRecipe[]> {
  await wait(3000 + Math.random() * 600);

  const names = selectedIngredients.map((i) => i.name);
  const urgentNames = selectedIngredients
    .filter((i) => i.priority === "use-first" || i.priority === "use-soon")
    .map((i) => i.name);
  const isQuick = cookTime === "quick";

  // Resolve "Surprise Me" to a concrete cuisine for fallback copy
  const resolvedCuisine =
    cuisine === "Surprise Me"
      ? ["Thai", "Mediterranean", "Mexican"][Math.floor(Math.random() * 3)]!
      : cuisine;

  const rescueReason = (extra: string) =>
    `${urgentNames.slice(0, 2).join(" and ") || names[0] || "These ingredients"} ${urgentNames.length > 1 ? "have" : "has"} the shortest freshness window${urgentNames.length > 1 ? "s" : ""} in your inventory — FridgePulse built this ${resolvedCuisine} dish to use ${extra} while they're still at their best.`;

  return buildFallbackRecipes(names, urgentNames, isQuick, resolvedCuisine, cookingWindow, rescueReason);
}

// ─── Fallback recipe bank ─────────────────────────────────────────────────────
// Deterministic recipes keyed by cuisine. Used both as fallback and as the
// Phase 1 mock. Phase 2 will call Claude instead.

function buildFallbackRecipes(
  names: string[],
  urgentNames: string[],
  isQuick: boolean,
  cuisine: string,
  window: CookingWindow,
  rescueReason: (extra: string) => string,
): RescueRecipe[] {
  const [a = "Protein", b = "Greens", c = "Produce"] = names;
  const primary = urgentNames[0] ?? a;
  const secondary = urgentNames[1] ?? b;

  type RecipeTemplate = Omit<RescueRecipe, "id" | "ingredients_used" | "rescue_reason">;

  const templates: Record<string, [RecipeTemplate, RecipeTemplate, RecipeTemplate]> = {
    Indian: [
      {
        name: `${primary} Tikka Masala`,
        time_minutes: isQuick ? 18 : 35,
        difficulty: isQuick ? "Easy" : "Medium",
        description: `A rich tomato-cream curry that turns ${primary} into a restaurant-worthy dish in ${isQuick ? "under 20 minutes" : "about 35 minutes"}.`,
        extra_ingredients: ["Tikka masala paste", "Coconut cream", "Garlic", "Ginger", "Basmati rice"],
        steps: [
          `Cut ${primary} into bite-sized pieces and season with salt and tikka spice.`,
          "Heat oil in a wide pan, sear the protein until golden (4 min each side).",
          "Add tikka masala paste and stir 1 minute until fragrant.",
          "Pour in coconut cream, simmer 8 minutes, stirring occasionally.",
          `Fold in ${secondary} for the last 2 minutes. Serve over basmati rice.`,
        ],
      },
      {
        name: `${primary} Saag`,
        time_minutes: isQuick ? 20 : 40,
        difficulty: "Medium",
        description: `Classic saag preparation that uses ${b} at its freshest, paired with ${primary} for a complete meal.`,
        extra_ingredients: ["Cumin seeds", "Onion", "Garlic", "Garam masala", "Naan or rice"],
        steps: [
          "Temper cumin seeds in oil until they pop. Add diced onion, cook 5 min.",
          "Add garlic and garam masala, stir 1 minute.",
          `Add ${b} leaves and ${primary}, cook covered 6 minutes.`,
          "Blend half the greens for a silky sauce, return to pan.",
          "Simmer 5 minutes. Serve with warm naan.",
        ],
      },
      {
        name: `${primary} & ${c} Biryani Bowl`,
        time_minutes: isQuick ? 20 : 45,
        difficulty: isQuick ? "Easy" : "Medium",
        description: `A fragrant one-pan biryani bowl using ${c} and ${primary} — all the flavour, half the effort.`,
        extra_ingredients: ["Biryani spice mix", "Pre-cooked rice", "Fried onions", "Fresh mint"],
        steps: [
          `Cook ${primary} in biryani spices until cooked through.`,
          `Add diced ${c} and stir-fry 3 minutes.`,
          "Fold in pre-cooked rice and mix well.",
          "Top with crispy fried onions and fresh mint.",
          "Serve immediately while hot.",
        ],
      },
    ],

    Mexican: [
      {
        name: `${primary} Street Tacos`,
        time_minutes: isQuick ? 15 : 30,
        difficulty: "Easy",
        description: `Vibrant street-style tacos built around ${primary}, loaded with ${b} and finished with lime.`,
        extra_ingredients: ["Corn tortillas", "Lime", "Cilantro", "Salsa", "Sour cream"],
        steps: [
          `Season ${primary} with cumin, chili powder, salt.`,
          "Cook in a hot cast-iron pan 3–4 min per side until charred.",
          "Rest 3 minutes, then slice thinly.",
          `Warm tortillas. Fill with ${primary}, ${b}, and ${c}.`,
          "Finish with lime juice, cilantro, and salsa.",
        ],
      },
      {
        name: `${primary} & ${b} Quesadilla`,
        time_minutes: isQuick ? 12 : 25,
        difficulty: "Easy",
        description: `Crispy quesadilla stuffed with ${primary} and ${b} — on the table in minutes.`,
        extra_ingredients: ["Flour tortillas", "Monterey Jack cheese", "Jalapeño", "Guacamole"],
        steps: [
          `Cook ${primary} with cumin and paprika, shred or slice.`,
          `Layer tortilla with cheese, ${primary}, ${b}, and jalapeño.`,
          "Top with second tortilla. Cook in dry pan 3 min per side.",
          "Slice into wedges. Serve with guacamole.",
        ],
      },
      {
        name: `${primary} Burrito Bowl`,
        time_minutes: isQuick ? 20 : 35,
        difficulty: "Easy",
        description: `A hearty burrito bowl with ${primary} as the hero, topped with ${c} and ${b}.`,
        extra_ingredients: ["Cooked rice", "Black beans", "Sour cream", "Salsa verde"],
        steps: [
          `Season and cook ${primary} until done, slice into strips.`,
          "Warm rice and black beans separately.",
          `Build bowls: rice base, beans, ${primary}, ${c}, ${b}.`,
          "Top with sour cream and salsa verde.",
        ],
      },
    ],

    Italian: [
      {
        name: `${primary} Pasta Primavera`,
        time_minutes: isQuick ? 20 : 35,
        difficulty: "Easy",
        description: `Light and fresh pasta that showcases ${b} and ${c} at their peak, with ${primary} for protein.`,
        extra_ingredients: ["Pasta (linguine or penne)", "Olive oil", "Parmesan", "Garlic", "Lemon zest"],
        steps: [
          "Cook pasta in well-salted water until al dente.",
          `Sauté garlic in olive oil, add ${primary}, cook 5 min.`,
          `Add ${b} and ${c}, toss 2 minutes.`,
          "Toss pasta with the vegetables, add pasta water to loosen.",
          "Finish with lemon zest and a generous handful of Parmesan.",
        ],
      },
      {
        name: `${primary} Saltimbocca`,
        time_minutes: isQuick ? 18 : 30,
        difficulty: "Medium",
        description: `Roman classic elevated with ${b}, pan-fried golden with sage butter.`,
        extra_ingredients: ["Prosciutto", "Fresh sage", "Butter", "White wine", "Capers"],
        steps: [
          `Pound ${primary} thin. Layer with prosciutto and sage.`,
          "Secure with a toothpick. Season lightly.",
          "Fry in butter, prosciutto-side down, 3 min. Flip, cook 2 min.",
          `Remove. Deglaze pan with white wine. Add ${b} and capers.`,
          "Spoon sauce over. Serve immediately.",
        ],
      },
      {
        name: `${primary} & ${c} Frittata`,
        time_minutes: isQuick ? 18 : 25,
        difficulty: "Easy",
        description: `A golden Italian frittata — the perfect way to use ${c} and ${primary} in one satisfying skillet dish.`,
        extra_ingredients: ["Eggs (6)", "Parmesan", "Olive oil", "Fresh basil"],
        steps: [
          "Preheat oven to 200°C / 390°F.",
          `Sauté ${primary} and ${c} in oven-safe pan until tender.`,
          "Pour beaten eggs seasoned with Parmesan over the top.",
          "Cook on hob 3 min until edges set. Transfer to oven.",
          "Bake 8 minutes until puffed and golden. Top with basil.",
        ],
      },
    ],

    Thai: [
      {
        name: `Thai Basil ${primary} Stir-Fry`,
        time_minutes: isQuick ? 15 : 25,
        difficulty: "Easy",
        description: `The classic pad krapow — intensely savoury with holy basil and ${primary} at the centre.`,
        extra_ingredients: ["Oyster sauce", "Fish sauce", "Thai basil", "Chili", "Jasmine rice"],
        steps: [
          `Chop ${primary} into small pieces. Mince garlic and chili.`,
          "Fry garlic and chili in hot oil 30 seconds.",
          `Add ${primary}, stir-fry on high heat 4 minutes.`,
          `Add ${b}, oyster sauce, fish sauce. Toss 2 minutes.`,
          "Fold in Thai basil off the heat. Serve over jasmine rice.",
        ],
      },
      {
        name: `${primary} Green Curry`,
        time_minutes: isQuick ? 20 : 35,
        difficulty: "Easy",
        description: `Aromatic green curry with ${primary} and ${c} in silky coconut milk.`,
        extra_ingredients: ["Green curry paste", "Coconut milk", "Kaffir lime leaves", "Fish sauce", "Jasmine rice"],
        steps: [
          "Fry green curry paste in oil 1 minute until fragrant.",
          "Pour in coconut milk. Bring to a gentle simmer.",
          `Add ${primary} and kaffir lime leaves, cook 8 minutes.`,
          `Add ${c} and ${b}, simmer 3 more minutes.`,
          "Season with fish sauce. Serve with jasmine rice.",
        ],
      },
      {
        name: `${primary} Pad See Ew Noodles`,
        time_minutes: isQuick ? 18 : 25,
        difficulty: "Easy",
        description: `Wide rice noodles wok-tossed with ${primary} and ${b} in a sweet-savoury sauce.`,
        extra_ingredients: ["Wide rice noodles", "Sweet soy sauce", "Oyster sauce", "Egg", "White pepper"],
        steps: [
          "Soak wide rice noodles per packet instructions.",
          `Stir-fry ${primary} in hot wok with oil, 4 min.`,
          "Push aside, crack in egg, scramble quickly.",
          `Add noodles, ${b}, sweet soy, and oyster sauce. Toss on high heat.`,
          "Finish with white pepper. Serve immediately.",
        ],
      },
    ],

    Mediterranean: [
      {
        name: `${primary} & ${b} Power Bowl`,
        time_minutes: isQuick ? 18 : 30,
        difficulty: "Easy",
        description: `Sun-drenched Mediterranean bowl with ${primary}, ${b}, and ${c} on a herby grain base.`,
        extra_ingredients: ["Quinoa or couscous", "Hummus", "Feta", "Lemon", "Za'atar"],
        steps: [
          "Cook quinoa or couscous per packet instructions.",
          `Season ${primary} with za'atar and lemon zest. Cook in olive oil 6 min.`,
          `Assemble bowls: grain base, ${primary}, ${b}, ${c}.`,
          "Add hummus on the side. Crumble feta on top.",
          "Drizzle with olive oil and lemon juice.",
        ],
      },
      {
        name: `Shakshuka with ${primary}`,
        time_minutes: isQuick ? 20 : 30,
        difficulty: "Easy",
        description: `Eggs poached in a spiced tomato sauce with ${b} and ${primary} — one pan, all flavour.`,
        extra_ingredients: ["Eggs (4)", "Crushed tomatoes", "Cumin", "Paprika", "Crusty bread"],
        steps: [
          `Sauté ${primary} and ${b} with cumin and paprika until soft.`,
          "Add crushed tomatoes, season, and simmer 8 minutes.",
          "Make wells in the sauce, crack in eggs.",
          "Cover and cook 5–6 minutes until whites are just set.",
          "Serve straight from the pan with crusty bread.",
        ],
      },
      {
        name: `${primary} Souvlaki Wrap`,
        time_minutes: isQuick ? 15 : 25,
        difficulty: "Easy",
        description: `Classic Greek street food — marinated ${primary} wrapped in flatbread with tzatziki and ${c}.`,
        extra_ingredients: ["Flatbread", "Tzatziki", "Red onion", "Paprika", "Olive oil"],
        steps: [
          `Slice ${primary} and marinate 5 min in olive oil, paprika, oregano.`,
          "Cook on high heat in a griddle or pan, 3 min each side.",
          `Warm flatbreads. Spread tzatziki generously.`,
          `Layer ${primary}, ${c}, red onion, ${b}.`,
          "Roll tightly and serve immediately.",
        ],
      },
    ],

    "American Comfort": [
      {
        name: `${primary} & ${b} Skillet`,
        time_minutes: isQuick ? 20 : 35,
        difficulty: "Easy",
        description: `A hearty one-pan skillet with ${primary} and ${b} — comfort food done right.`,
        extra_ingredients: ["Butter", "Garlic powder", "Cheddar", "Hot sauce", "Mashed potatoes or biscuits"],
        steps: [
          `Season ${primary} generously with garlic powder, salt, pepper.`,
          "Melt butter in cast-iron over medium-high. Sear until golden.",
          `Add ${b} and ${c} to the pan, cook 4 minutes.`,
          "Grate cheddar on top, cover and melt 2 minutes.",
          "Serve with mashed potatoes or biscuits. Add hot sauce to taste.",
        ],
      },
      {
        name: `${primary} Grilled Sandwich`,
        time_minutes: isQuick ? 12 : 20,
        difficulty: "Easy",
        description: `The ultimate grilled sandwich — ${primary} layered with ${b} and melted cheese on toasted bread.`,
        extra_ingredients: ["Sourdough bread", "Cheddar", "Mayo", "Mustard", "Butter"],
        steps: [
          `Cook ${primary} in a pan until done. Season well.`,
          "Spread mayo and mustard on sourdough slices.",
          `Layer: bread, cheese, ${primary}, ${b}, cheese, bread.`,
          "Butter the outside. Grill in pan on medium 3 min per side.",
          "Press down with a spatula. Serve immediately.",
        ],
      },
      {
        name: `${primary} Rice Bowl`,
        time_minutes: isQuick ? 18 : 30,
        difficulty: "Easy",
        description: `A loaded southern-style rice bowl with ${primary}, crispy ${c}, and braised ${b}.`,
        extra_ingredients: ["Cooked white rice", "BBQ sauce", "Garlic butter", "Green onions"],
        steps: [
          `Cook ${primary} with BBQ sauce glaze until caramelized.`,
          `Sauté ${c} in garlic butter until tender.`,
          "Wilt ${b} in the same pan with a splash of water.",
          "Build bowls: rice, then everything on top.",
          "Finish with green onions and extra BBQ sauce.",
        ],
      },
    ],

    Japanese: [
      {
        name: `${primary} Teriyaki Bowl`,
        time_minutes: isQuick ? 18 : 30,
        difficulty: "Easy",
        description: `Sticky teriyaki ${primary} with ${b} over steamed rice — a Japanese classic reinvented with your freshest ingredients.`,
        extra_ingredients: ["Soy sauce", "Mirin", "Honey", "Sesame seeds", "Steamed rice"],
        steps: [
          `Mix soy sauce, mirin, and honey. Marinate ${primary} 5 min.`,
          "Cook ${primary} in a non-stick pan over medium-high heat 4 min per side.",
          "Pour in remaining marinade. Glaze 2 minutes until sticky.",
          `Add ${b} to the pan, wilt 1 minute.`,
          "Serve over steamed rice, top with sesame seeds.",
        ],
      },
      {
        name: `${primary} Miso Soup Bowl`,
        time_minutes: isQuick ? 15 : 25,
        difficulty: "Easy",
        description: `Warming dashi-miso broth with ${primary} and ${b} — Japanese comfort in a bowl.`,
        extra_ingredients: ["White miso paste", "Dashi stock", "Tofu", "Spring onions", "Soba or udon noodles"],
        steps: [
          "Bring dashi to a gentle simmer. Do not boil.",
          `Add ${primary} and cook 5 minutes.`,
          `Add noodles and ${b}, cook 2 more minutes.`,
          "Dissolve miso paste in a ladle of broth, stir in.",
          "Garnish with tofu cubes and spring onions.",
        ],
      },
      {
        name: `${primary} & ${c} Donburi`,
        time_minutes: isQuick ? 20 : 30,
        difficulty: "Easy",
        description: `A simple rice bowl loaded with glazed ${primary} and sautéed ${c} — the essence of weeknight Japanese cooking.`,
        extra_ingredients: ["Steamed rice", "Soy sauce", "Sake or dry sherry", "Soft-boiled egg", "Pickled ginger"],
        steps: [
          `Slice ${primary} and cook with soy and sake glaze until caramelized.`,
          `Stir-fry ${c} in sesame oil 3 minutes.`,
          "Arrange rice in deep bowls.",
          `Top with ${primary}, ${c}, and halved soft-boiled egg.`,
          "Serve with pickled ginger on the side.",
        ],
      },
    ],

    "Middle Eastern": [
      {
        name: `${primary} Shawarma Bowl`,
        time_minutes: isQuick ? 20 : 35,
        difficulty: "Easy",
        description: `Bold shawarma spices on ${primary} — a stunning Middle Eastern bowl with ${b} and tahini drizzle.`,
        extra_ingredients: ["Shawarma spice blend", "Tahini", "Lemon", "Garlic", "Flatbread or rice"],
        steps: [
          `Toss ${primary} in shawarma spices, salt, and olive oil.`,
          "Cook over high heat 4–5 min per side until charred.",
          `Build bowls with ${b} as the base, then ${c}.`,
          "Slice rested ${primary} on top.",
          "Drizzle with tahini thinned with lemon juice and garlic.",
        ],
      },
      {
        name: `${primary} & ${b} Fattoush`,
        time_minutes: isQuick ? 15 : 20,
        difficulty: "Easy",
        description: `A vibrant Levantine salad with crispy pita, ${b}, ${c}, and grilled ${primary}.`,
        extra_ingredients: ["Pita bread", "Sumac", "Pomegranate molasses", "Olive oil", "Mint"],
        steps: [
          "Toast pita torn into chunks until golden and crispy.",
          `Grill or pan-fry ${primary} with sumac and olive oil.`,
          `Toss ${b}, ${c}, and herbs with sumac vinaigrette.`,
          "Add crispy pita, toss gently.",
          "Slice ${primary} on top, drizzle pomegranate molasses.",
        ],
      },
      {
        name: `${primary} Kofta Plate`,
        time_minutes: isQuick ? 20 : 35,
        difficulty: "Medium",
        description: `Spiced kofta-inspired patties from ${primary} with ${c} and herby yoghurt dressing.`,
        extra_ingredients: ["Ras el hanout", "Onion", "Greek yogurt", "Cucumber", "Pitta"],
        steps: [
          `Blend ${primary} with ras el hanout, grated onion, and salt.`,
          "Shape into small patties or logs.",
          "Cook in oiled pan 4 min per side until cooked through.",
          `Serve on pitta with ${c} salad and ${b}.`,
          "Drizzle with yogurt mixed with garlic and lemon.",
        ],
      },
    ],
  };

  // Resolve to the best available template (default to Indian if unknown)
  const key = Object.keys(templates).find((k) => k.toLowerCase() === cuisine.toLowerCase())
    ?? "Indian";
  const chosen = templates[key] ?? templates["Indian"]!;

  return chosen.map((t, i) => ({
    ...t,
    id: `rescue-${i}`,
    ingredients_used: names.slice(0, Math.min(names.length, 2 + i)),
    rescue_reason: rescueReason(t.name),
  }));
}

function titleFor(names: string[]) {
  const [a = "Kitchen", b = "Garden"] = names;
  const shapes = ["Wrap", "Skillet", "Bowl", "Flatbread"];
  const shape = shapes[(a.length + b.length) % shapes.length];
  return `Creamy ${a.split(" ")[0]} & ${b.split(" ")[0]} ${shape}`;
}
