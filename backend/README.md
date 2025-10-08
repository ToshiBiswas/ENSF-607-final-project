# InStock API

Submitted by Bader M., Duha W., Felipe C., Kal W., and Toshi B. 

The InStock web app can be found in this link: https://github.com/duhawall/clever-cypresses-instock-frontend

Front-end Port: http://localhost:5173/ Back-end Port: http://localhost:8080/

Please look at the env.sample provided to define your environmental variables! **Especially all the local host ports**

You can run the server via `npm run dev` or `node --watch index.js`

Create your own database using:
1. `npm db:migrate`
2. `npm db:seed`

## Log

The purpose of this API is to provide the InStock web app with the following 11 endpoints to interact with this API's data:

1. **GET /warehouses** - to retrieve a list of the details all warehouses.
2. **GET /inventories** - to retrieve a list of the details all inventories.
3. **GET /warehouses/:id** - to retrieve details of one warehouse.
4. **GET /inventories/:id** - to retrieve items of an inventory.
5. **GET /warehouses/:id/inventories** - to retrieve the inventory of one warehouse.
6. **POST /warehouses/** - to add a new warehouse.
7. **POST /inventories/** - to add a new inventory.
8. **PUT /warehouses/:id** - to edit a warehouse.
9. **PUT /inventories/:id** - to edit an inventory.
10. **DELETE /warehouses/:id** - to delete a warehouse.
11. **DELETE /inventories/:id** - to delete an inventory.
