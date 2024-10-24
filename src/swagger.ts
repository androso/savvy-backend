import swaggerDoc from 'swagger-jsdoc'
import swaggerUI from 'swagger-ui-express'
import { Express, Response, Request } from 'express'
import YAML from 'yamljs'

const swaggerDocument = YAML.load('./src/swagger.yaml')

const swaggerEndPoint = (app: Express, port: number | string)=>{
    app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocument))
    app.get('/docs.json', (req: Request, res: Response)=>{
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerDocument)
    })   
    console.log(`Documentation is avaible on http://localhost:${port}/api-docs`)
}

export default swaggerEndPoint;