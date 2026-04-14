// Mifflin-St Jeor BMR → TDEE → goal adjustment

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

const GOAL_ADJUSTMENTS = {
  'lose fat': -400,
  'build muscle': 300,
  'maintain': 0,
  'athletic performance': 200,
}

export function calcTDEE(profile) {
  const { weight, height, age, gender, activityLevel, goal } = profile

  // Convert lbs → kg, inches total → cm
  const weightKg = (weight || 170) * 0.453592
  const totalInches = ((height?.ft || 5) * 12) + (height?.in || 10)
  const heightCm = totalInches * 2.54
  const ageVal = age || 25

  let bmr
  if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageVal - 161
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageVal + 5
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375
  const tdee = bmr * multiplier
  const adjustment = GOAL_ADJUSTMENTS[goal] || 0
  const targetCalories = Math.round(tdee + adjustment)

  // Macros
  const weightLbs = weight || 170
  const protein = Math.round(weightLbs * 1) // 1g per lb
  const fat = Math.round((targetCalories * 0.25) / 9)
  const proteinCals = protein * 4
  const fatCals = fat * 9
  const carbs = Math.round((targetCalories - proteinCals - fatCals) / 4)

  return {
    calories: targetCalories,
    protein,
    fat,
    carbs,
  }
}
