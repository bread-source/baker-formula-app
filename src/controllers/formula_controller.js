import { Controller } from "stimulus"
import * as URLON from "urlon"

export default class extends Controller {

  static get targets() {
    return [
      "ingredient",
      "ingredientTable",
      "totalPercent",
      "totalDoughWeight"
    ]
  }

  connect() {
    try {
      // Attempt to parse the URL
      const serializedRecipe = window.location.search.substring(1)
      this.deserializeFormula(serializedRecipe)
    } catch {
      // Fall back to a tried-and-true recipe
      const baseRecipe = "$b:918.5&i@$n=Flour&p:100;&$n=Water&p:63;&$n=Yeast&p:2;&$n=Salt&p:2"
      this.deserializeFormula(baseRecipe)
    }
  }

  // Controller methods

  deleteIngredient(event) {
    const ingredientIndex = event.target.parentElement.parentElement.rowIndex
    this.ingredientTableTarget.deleteRow(ingredientIndex)
    this.updateIngredientWeights()
  }

  newIngredient() {
    this.addIngredient("", 0)
  }

  updateIngredientWeights() {
    const PERCENT_COLUMN = 1
    const WEIGHT_COLUMN = 2

    const totalPercentage = this.ingredientTargets.reduce((percent, element) => {
      const elementValue = this.sanitizeFloatInput(element.cells[PERCENT_COLUMN].childNodes[0].value)
      return percent + elementValue
    }, 0)
    this.totalPercentTarget.value = totalPercentage

    this.ingredientTargets.forEach((element, index) => {
      const ingredientPercent = this.sanitizeFloatInput(element.cells[PERCENT_COLUMN].childNodes[0].value)
      let finalIngredientWeight = (ingredientPercent * this.totalDoughWeight) / totalPercentage
      finalIngredientWeight = Math.round(finalIngredientWeight * 100) / 100.0
      element.cells[WEIGHT_COLUMN].childNodes[0].value = finalIngredientWeight
    })
  }

  // Business Logic

  addIngredient(name, percent) {
    let newIngredientRow = this.ingredientTableTarget.insertRow()
    newIngredientRow.setAttribute("data-target", "formula.ingredient")
    newIngredientRow.innerHTML = `
      <td><input type="string" value="${name}"></td>
      <td><input data-action="formula#updateIngredientWeights" type="number" value="${percent}" step="0.01"></td>
      <td><input data-action="formula#calculateDoughWeight" type="number" step="0.01"></td>
      <td><button data-action="formula#deleteIngredient">-</button></td>
    `.trim()
  }

  calculateDoughWeight(event) {
    const newWeight = this.sanitizeFloatInput(event.target.value)
    const totalPercent = this.sanitizeIntInput(this.totalPercentTarget.value)

    // If an ingredient has 0% then it doesn't affect the final dough weight, so we should quit early
    const ingredientPercent = this.sanitizeFloatInput(event.target.parentElement.parentElement.cells[1].childNodes[0].value)
    if(ingredientPercent <= 0) {
      return
    }
    this.totalDoughWeight = (newWeight * totalPercent) / ingredientPercent
  }
  get totalDoughWeight() {
    return parseFloat(this.totalDoughWeightTarget.value)
  }

  set totalDoughWeight(value) {
    let floatValue = this.sanitizeFloatInput(value)
    floatValue = Math.round(floatValue * 100) / 100.0
    this.totalDoughWeightTarget.value = floatValue
    this.updateIngredientWeights()
  }

  // Helpers

  /* The data format is custom and intentionally small to make smaller URLs
   * It is defined as follows:
   * {
   *   b: [String] The base dough weight,
   *   i: [Array] The list of ingredients
   *     => {
   *       n: [String] Name of the ingredient,
   *       p: [Number] Percentage by weight of an ingredient
   *     }
   * }
   */
  serializeFormula() {
    const NAME_COLUMN = 0
    const PERCENT_COLUMN = 1

    const serializedIngredients = this.ingredientTargets.map((element) => {
      return {
        n: element.cells[NAME_COLUMN].childNodes[0].value,
        p: this.sanitizeIntInput(element.cells[PERCENT_COLUMN].childNodes[0].value)
      }
    })

    const jsonFormula = {
      b: this.totalDoughWeight,
      i: serializedIngredients
    }
    console.log(URLON.stringify(jsonFormula))
  }

  deserializeFormula(formula) {
    const deserializedFormula = URLON.parse(formula)

    deserializedFormula.i.forEach((ingredient) => {
      this.addIngredient(ingredient.n, ingredient.p)
    })

    this.totalDoughWeight = deserializedFormula.b
  }


  sanitizeFloatInput(value) {
    const floatValue = parseFloat(value)
    if(isNaN(floatValue)) {
      return 0
    }
    return floatValue
  }

  sanitizeIntInput(value) {
    const intValue = parseInt(value)
    if(isNaN(intValue)) {
      return 0
    }
    return intValue
  }

  // TODO Pull in data-key from URL when present, otherwise default recipe
  //      Allow swapping of weights
  //      Generate copyable link
  //      Stabilize table so it doesn't shrink when last ingredient is removed
}
