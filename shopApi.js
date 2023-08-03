const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());
app.use(function (req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
  );
  next();
});
const port = process.env.PORT || 2410;
app.listen(port, () => console.log(`Node app listening on port ${port}`));
const shopsFilePath = "./shops.json";
const productsFilePath = "./products.json";
const purchasesFilePath = "./purchases.json";
const {shops, products, purchases} = require("./shopData");
app.get("/svr/resetData/shops", (req, res) => {
  fs.writeFile(shopsFilePath, JSON.stringify(shops, null, 2), { flag: 'w' }, (err) => {
    if (err) {
      console.error("Error while writing data:", err);
      res.status(500).send("An error occurred while writing data.");
    } else {
      res.send(`Successfully reset data. Affected rows: ${shops.length}`);
    }
  });
});

app.get("/svr/resetData/products", (req, res) => {
  fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), { flag: 'w' }, (err) => {
    if (err) {
      console.error("Error while writing data:", err);
      res.status(500).send("An error occurred while writing data.");
    } else {
      res.send(`Successfully reset data. Affected rows: ${products.length}`);
    }
  });
});

app.get("/svr/resetData/purchases", (req, res) => {
  fs.writeFile(purchasesFilePath, JSON.stringify(purchases, null, 2), { flag: 'w' }, (err) => {
    if (err) {
      console.error("Error while writing data:", err);
      res.status(500).send("An error occurred while writing data.");
    } else {
      res.send(`Successfully reset data. Affected rows: ${purchases.length}`);
    }
  });
});

app.get("/svr/shops", (req, res) => {
  fs.readFile(shopsFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
    } else {
      res.send(JSON.parse(data));
    }
  });
});

app.get("/svr/products", (req, res) => {
  fs.readFile(productsFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
    } else {
      res.send(JSON.parse(data));
    }
  });
});
app.get("/svr/purchases", (req, res) => {
  const { shop, product, sort } = req.query;
  fs.readFile(purchasesFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
      return;
    }

    const purchases = JSON.parse(data);
    let filteredPurchases = purchases;

    if (shop) {
      filteredPurchases = filteredPurchases.filter(p => p.shopid === shop);
    }

    if (product) {
      filteredPurchases = filteredPurchases.filter(p => p.productid === product);
    }

    if (sort) {
      const validSortFields = ["QtyAsc", "QtyDesc", "ValueAsc", "ValueDesc"];
      const orderBy = validSortFields.find(sortKey => sortKey === sort);
      if (orderBy) {
        const sortField = orderBy === "QtyAsc" || orderBy === "QtyDesc" ? "quantity" : "price";
        const sortOrder = orderBy === "QtyAsc" || orderBy === "ValueAsc" ? 1 : -1;
        filteredPurchases.sort((a, b) => (a[sortField] - b[sortField]) * sortOrder);
      }
    }

    res.send(filteredPurchases);
  });
});


app.get("/svr/purchases/shops/:id", (req, res) => {
  const id = +req.params.id;
  const sql =
    "SELECT p.productid, p.shopid, p.quantity, p.price, s.name,s.rent FROM purchases p INNER JOIN shops s ON p.shopid = s.shopid WHERE p.shopid = $1 ORDER BY s.shopid";
  fs.readFile(purchasesFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
    } else {
      const purchases = JSON.parse(data);
      const filteredPurchases = purchases.filter(p => p.shopid === id);
      res.send(filteredPurchases);
    }
  });
});

app.get("/svr/purchases/products/:id", (req, res) => {
  const id = +req.params.id;
  const sql =
    "SELECT p.productid, p.shopid, p.quantity, p.price, s.productname,s.category,s.description FROM purchases p INNER JOIN products s ON p.productid = s.productid WHERE p.productid = $1 ORDER BY s.productid";
  fs.readFile(purchasesFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
    } else {
      const purchases = JSON.parse(data);
      const filteredPurchases = purchases.filter(p => p.productid === id);
      res.send(filteredPurchases);
    }
  });
});

app.post("/svr/shops", (req, res, next) => {
  console.log("Request Body:", req.body);
  let { name, rent } = req.body;
  const newShop = { shopId: Date.now(), name, rent };
  fs.readFile(shopsFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
    } else {
      const existingShops = JSON.parse(data);
      existingShops.push(newShop);
      fs.writeFile(shopsFilePath, JSON.stringify(existingShops, null, 2), { flag: 'w' }, (err) => {
        if (err) {
          console.error("Error while inserting data:", err);
          res.status(500).send("An error occurred while inserting data.");
        } else {
          res.send(`Successfully inserted new shop.`);
        }
      });
    }
  });
});

app.put("/svr/products/:id", (req, res) => {
  const id = +req.params.id;
  let { productname, category, description } = req.body;
  if (id) {
    fs.readFile(productsFilePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error while reading data:", err);
        res.status(500).send("An error occurred while reading data.");
      } else {
        const products = JSON.parse(data);
        const productIndex = products.findIndex(p => p.productid === id);
        if (productIndex !== -1) {
          products[productIndex].productname = productname;
          products[productIndex].category = category;
          products[productIndex].description = description;
          fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), { flag: 'w' }, (err) => {
            if (err) {
              console.error("Error while updating data:", err);
              res.status(500).send("An error occurred while updating data.");
            } else {
              res.send(`Successfully updated product with id ${id}.`);
            }
          });
        } else {
          res.status(404).send(`Product with id ${id} not found.`);
        }
      }
    });
  } else {
    res.status(400).send("Invalid product id provided.");
  }
});
