import { Application } from "stimulus"

import FormulaController from "./src/controllers/formula_controller.js"

const application = Application.start()
application.register("formula", FormulaController)
