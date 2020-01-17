import { Controller } from "stimulus"

export default class extends Controller {

  static get targets() {
    return [
      "flourWeight",
      "ingredientTable",
      "ingredientPercent",
      "ingredientWeight",
      "totalPercent",
      "totalWeight"
    ]
  }

  connect() {
    this.flourWeightTarget.value = 500
    this.updateWeights()
  }

  deleteIngredient(event) {
    const ingredientIndex = event.target.parentElement.parentElement.rowIndex
    this.ingredientTableTarget.deleteRow(ingredientIndex)
  }

  addIngredient() {
    let newIngredientRow = this.ingredientTableTarget.insertRow()
    newIngredientRow.innerHTML = `
      <td><input data-target="formula.ingredientName" type="string"></td>
      <td><input data-target="formula.ingredientPercent" data-action="formula#updateWeights" type="number" step="0.01"></td>
      <td><input data-target="formula.ingredientWeight" data-action="formula#calculateFlourWeight" type="number" step="0.01"></td>
      <td><button data-action="formula#deleteIngredient">-</button></td>
    `.trim()
  }

  updateWeights() {
    const totalFlourPercentage = 100; // Flour is always 100%
    const totalPercentage = this.ingredientPercentTargets.reduce((percent, element) => {
      let elementValue = parseFloat(element.value)
      if(!isNaN(elementValue))
        return percent + elementValue
    }, totalFlourPercentage)
    this.totalPercentTarget.value = totalPercentage

    const baseFlourWeight = this.baseFlourWeight
    let totalWeight = baseFlourWeight
    this.ingredientWeightTargets.forEach((element, index) => {
      let ingredientPercent = parseFloat(this.ingredientPercentTargets[index].value)
      if(isNaN(ingredientPercent)) {
        ingredientPercent = 0
      }
      let finalIngredientWeight = (ingredientPercent * this.baseFlourWeight) / 100
      finalIngredientWeight = Math.round(finalIngredientWeight * 100) / 100.0
      element.value = finalIngredientWeight
      totalWeight += finalIngredientWeight
    })
    this.totalWeightTarget.value = totalWeight
  }

  calculateFlourWeight(event) {
    let newWeight = parseFloat(event.target.value)
    if(isNaN(newWeight)) {
      newWeight = 0
    }
    let ingredientPercent = parseFloat(event.target.parentElement.parentElement.cells[1].childNodes[0].value)
    if(isNaN(ingredientPercent) || ingredientPercent <= 0) {
      return
    }
    this.baseFlourWeight = (newWeight * 100.0) / ingredientPercent
  }

  setFlourWeight(event) {
    this.baseFlourWeight = event.target.value
  }

  get baseFlourWeight() {
    const baseFlourWeight = this.flourWeightTarget.value
    if(isNaN(baseFlourWeight)) {
      return 500
    }
    return parseFloat(baseFlourWeight)
  }

  set baseFlourWeight(value) {
    let floatValue = parseFloat(value)
    if(isNaN(floatValue)) {
      this.flourWeightTarget.value = 500
    }
    floatValue = Math.round(floatValue * 100) / 100.0
    this.flourWeightTarget.value = floatValue
    this.updateWeights()
  }

  // TODO Allow editting other values to change baseFlourWeight
  //      Generate data-key for building from a parameter
  //      Pull in data-key from URL when present, otherwise default recipe
  //      Stabilize table so it doesn't shrink when last ingredient is removed
  //      Choose "base" recipe and populate based on that
}
