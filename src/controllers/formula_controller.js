import { Controller } from "stimulus"

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
    this.totalDoughWeight = 500
    this.updateIngredientWeights()
    this.addIngredient() // Temp while I flesh out on-connect behavior
  }

  deleteIngredient(event) {
    const ingredientIndex = event.target.parentElement.parentElement.rowIndex
    this.ingredientTableTarget.deleteRow(ingredientIndex)
    this.updateIngredientWeights()
  }

  addIngredient() {
    let newIngredientRow = this.ingredientTableTarget.insertRow()
    newIngredientRow.setAttribute("data-target", "formula.ingredient")
    newIngredientRow.innerHTML = `
      <td><input type="string"></td>
      <td><input data-action="formula#updateIngredientWeights" type="number" step="0.01"></td>
      <td><input data-action="formula#calculateDoughWeight" type="number" step="0.01"></td>
      <td><button data-action="formula#deleteIngredient">-</button></td>
    `.trim()
  }

  updateIngredientWeights() {
    const PERCENT_COLUMN = 1
    const WEIGHT_COLUMN = 2

    const totalPercentage = this.ingredientTargets.reduce((percent, element) => {
      const elementValue = this.sanitizeFloatInput(element.cells[PERCENT_COLUMN].childNodes[0].value)
      console.log(element.cells[PERCENT_COLUMN])
      console.log(elementValue)
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

  calculateDoughWeight(event) {
    const newWeight = this.sanitizeFloatInput(event.target.value)
    let totalPercent = parseInt(this.totalPercentTarget.value)
    if(isNaN(totalPercent)) {
      totalPercent = 0
    }

    // If an ingredient has 0% then it doesn't affect the final dough weight, so we should quit early
    const ingredientPercent = this.sanitizeFloatInput(event.target.parentElement.parentElement.cells[1].childNodes[0].value)
    if(ingredientPercent <= 0) {
      return
    }
    this.totalDoughWeight = (newWeight * totalPercent) / ingredientPercent
  }

  sanitizeFloatInput(value) {
    const floatValue = parseFloat(value)
    if(isNaN(floatValue)) {
      return 0
    }
    return floatValue
  }

  serializeFormula() {
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

  // TODO Generate data-key for building from a parameter
  //      Pull in data-key from URL when present, otherwise default recipe
  //      Stabilize table so it doesn't shrink when last ingredient is removed
  //      Choose "base" recipe and populate based on that
}
