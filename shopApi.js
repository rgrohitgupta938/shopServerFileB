const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());
app.use(function (req, res, next) {
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
const { shops, products, purchases } = require("./shopData");
app.get("/svr/resetData/shops", (req, res) => {
  fs.writeFile(shopsFilePath, JSON.stringify(shops, null, 2), (err) => {
    if (err) {
      console.error("Error while writing data:", err);
      res.status(500).send("An error occurred while writing data.");
    } else {
      res.send(`Successfully reset data. Affected rows: ${shops.length}`);
    }
  });
});

app.get("/svr/resetData/products", (req, res) => {
  fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error("Error while writing data:", err);
      res.status(500).send("An error occurred while writing data.");
    } else {
      res.send(`Successfully reset data. Affected rows: ${products.length}`);
    }
  });
});

app.get("/svr/resetData/purchases", (req, res) => {
  fs.writeFile(purchasesFilePath, JSON.stringify(purchases, null, 2), (err) => {
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
  let { shop, sort } = req.query;
  let product = req.query.product || null;
  console.log(product);
  const removePr = (product) => product.replace("pr", "");
  const removeSt = (shop) => shop.replace("st", "");
  fs.readFile(purchasesFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
      return;
    }
    const purchases = JSON.parse(data);
    let filteredPurchases = purchases;
    if (shop) {
      shop = removeSt(shop);
      console.log(shop);
      let st = shops.find((sh) => sh.shopid === +shop);
      console.log(st);
      if (st) {
        filteredPurchases = filteredPurchases.filter(
          (p) => p.shopid === st.shopid
        );
      } else {
        filteredPurchases = [];
      }
    }
    if (product) {
      const productIds = product.split(",").map(removePr);
      filteredPurchases = filteredPurchases.filter((p) =>
        productIds.includes(p.productid.toString())
      )
        ? filteredPurchases.filter((p) =>
            productIds.includes(p.productid.toString())
          )
        : [];
    }
    if (sort) {
      const validSortFields = ["QtyAsc", "QtyDesc", "ValueAsc", "ValueDesc"];
      const orderBy = validSortFields.find((sortKey) => sortKey === sort);
      if (orderBy === "QtyAsc") {
        filteredPurchases.sort((a, b) => a.quantity - b.quantity);
      } else if (orderBy === "QtyDesc") {
        filteredPurchases.sort((a, b) => b.quantity - a.quantity);
      } else if (orderBy === "ValueAsc") {
        filteredPurchases.sort(
          (a, b) => a.price * a.quantity - b.price * b.quantity
        );
      } else if (orderBy === "ValueDesc") {
        filteredPurchases.sort(
          (a, b) => b.price * b.quantity - a.price * a.quantity
        );
      }
    }
    res.send(filteredPurchases);
  });
});
app.get("/svr/purchases/shops/:id", function (req, res) {
  const id = +req.params.id;
  console.log(id);
  fs.readFile("purchases.json", "utf8", (err, purchaseData) => {
    if (err) {
      console.error("Error reading purchases data:", err);
      res.status(500).send("An error occurred while fetching purchases.");
      return;
    }
    fs.readFile("shops.json", "utf8", (err, shopData) => {
      if (err) {
        console.error("Error reading shops data:", err);
        res.status(500).send("An error occurred while fetching shops.");
        return;
      }
      const purchases = JSON.parse(purchaseData);
      const shops = JSON.parse(shopData);
      const filteredPurchases = purchases.filter(
        (purchase) => purchase.shopid === id
      );
      const result = filteredPurchases.map((purchase) => {
        const shop = shops.find((shop) => shop.shopId === purchase.shopid);
        return {
          productid: purchase.productid,
          shopid: purchase.shopid,
          quantity: purchase.quantity,
          price: purchase.price,
          name: shop.name,
          rent: shop.rent,
        };
      });
      console.log(result);
      res.send(result);
    });
  });
});

app.get("/svr/purchases/products/:id", (req, res) => {
  const productId = +req.params.id;
  fs.readFile(purchasesFilePath, "utf8", (err, purchasesData) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
      return;
    }
    fs.readFile(productsFilePath, "utf8", (err, productsData) => {
      if (err) {
        console.error("Error while reading data:", err);
        res.status(500).send("An error occurred while reading data.");
        return;
      }
      console.log(purchasesData, productsData);
      const purchases = JSON.parse(purchasesData);
      const products = JSON.parse(productsData);
      const filteredPurchases = purchases.filter(
        (p) => p.productid === productId
      );
      const purchasesWithDetails = filteredPurchases.map((p) => {
        const productDetails = products.find(
          (product) => product.productid === p.productid
        );
        return {
          ...p,
          productname: productDetails ? productDetails.productname : "Unknown",
          category: productDetails ? productDetails.category : "Unknown",
          description: productDetails ? productDetails.description : "Unknown",
          shopid: p.shopid,
        };
      });
      console.log(purchasesWithDetails);
      res.send(purchasesWithDetails);
    });
  });
});

app.post("/svr/shops", (req, res, next) => {
  console.log("Request Body:", req.body);
  let { name, rent } = req.body;
  const newShop = { name, rent };
  fs.readFile(shopsFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error while reading data:", err);
      res.status(500).send("An error occurred while reading data.");
    } else {
      const existingShops = JSON.parse(data);
      existingShops.push({ ...newShop, shopId: existingShops.length + 1 });
      fs.writeFile(
        shopsFilePath,
        JSON.stringify(existingShops, null, 2),
        (err) => {
          if (err) {
            console.error("Error while inserting data:", err);
            res.status(500).send("An error occurred while inserting data.");
          } else {
            res.send(`Successfully inserted new shop.`);
          }
        }
      );
    }
  });
});

app.put("/svr/products/:id", (req, res) => {
  const id = +req.params.id;
  console.log(id);
  let { productname, category, description } = req.body;
  if (id) {
    fs.readFile(productsFilePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error while reading data:", err);
        res.status(500).send("An error occurred while reading data.");
      } else {
        const products = JSON.parse(data);
        const productIndex = products.findIndex((p) => p.productid === id);
        if (productIndex !== -1) {
          products[productIndex].productname = productname;
          products[productIndex].category = category;
          products[productIndex].description = description;
          fs.writeFile(
            productsFilePath,
            JSON.stringify(products, null, 2),
            (err) => {
              if (err) {
                console.error("Error while updating data:", err);
                res.status(500).send("An error occurred while updating data.");
              } else {
                res.send(`Successfully updated product with id ${id}.`);
              }
            }
          );
        } else {
          res.status(404).send(`Product with id ${id} not found.`);
        }
      }
    });
  } else {
    res.status(400).send("Invalid product id provided.");
  }
});
app.get("/svr/totalPurchase/shop/:id", function (req, res) {
  const shopId = +req.params.id;
  fs.readFile("purchases.json", "utf8", (err, purchaseData) => {
    if (err) {
      console.error("Error reading purchases data:", err);
      res.status(500).send("An error occurred while fetching total purchases.");
      return;
    }

    fs.readFile("shops.json", "utf8", (err, shopData) => {
      if (err) {
        console.error("Error reading shops data:", err);
        res
          .status(500)
          .send("An error occurred while fetching total purchases.");
        return;
      }
      const purchases = JSON.parse(purchaseData);
      const shops = JSON.parse(shopData);
      const shop = shops.find((s) => s.shopId === shopId);
      if (!shop) {
        res.status(404).send("Shop not found.");
        return;
      }
      const filteredPurchases = purchases.filter(
        (purchase) => purchase.shopid === shopId
      );
      const totalPurchases = filteredPurchases.reduce((acc, purchase) => {
        const existingProduct = acc.find(
          (item) => item.productid === purchase.productid
        );
        if (existingProduct) {
          existingProduct.totalQuantity += purchase.quantity;
          existingProduct.totalPrice += purchase.quantity * purchase.price;
        } else {
          acc.push({
            productid: purchase.productid,
            shopid: purchase.shopid,
            totalquantity: purchase.quantity,
            totalprice: purchase.quantity * purchase.price,
            name: shop.name,
            rent: shop.rent,
          });
        }
        return acc;
      }, []);
      console.log(totalPurchases);
      res.send(totalPurchases);
    });
  });
});

app.get("/svr/totalPurchase/product/:id", function (req, res) {
  const productId = req.params.id;
  console.log(productId);
  fs.readFile("purchases.json", "utf8", (err, purchaseData) => {
    if (err) {
      console.error("Error reading purchases data:", err);
      res.status(500).send("An error occurred while fetching total purchase.");
      return;
    }
    fs.readFile("shops.json", "utf8", (err, shopData) => {
      if (err) {
        console.error("Error reading shops data:", err);
        res
          .status(500)
          .send("An error occurred while fetching total purchase.");
        return;
      }
      const purchases = JSON.parse(purchaseData);
      const shops = JSON.parse(shopData);
      const filteredPurchases = purchases.filter(
        (purchase) => +purchase.productid === +productId
      );
      console.log(filteredPurchases, shops);
      const totalPurchaseByShop = filteredPurchases.reduce((acc, purchase) => {
        console.log(purchase);
        const shop = shops.find((shop) => +shop.shopId === +purchase.shopid);
        console.log(shop);
        if (shop) {
          const totalquantity = acc[purchase.shopid]
            ? acc[purchase.shopid].totalquantity + purchase.quantity
            : purchase.quantity;
          const totalprice = acc[purchase.shopid]
            ? acc[purchase.shopid].totalprice +
              purchase.price * purchase.quantity
            : purchase.price * purchase.quantity;
          acc[purchase.shopid] = {
            productid: purchase.productid,
            shopid: purchase.shopid,
            name: shop.name,
            rent: shop.rent,
            totalquantity,
            totalprice,
          };
        }
        return acc;
      }, {});
      const totalPurchaseArray = Object.values(totalPurchaseByShop);
      console.log(totalPurchaseArray);
      res.json(totalPurchaseArray);
    });
  });
});
app.get("/svr/products/:id", function (req, res) {
  const id = +req.params.id;
  console.log(id);
  fs.readFile("products.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading products data:", err);
      res.status(500).send("An error occurred while fetching products.");
      return;
    }
    const products = JSON.parse(data);
    const product = products.find((prod) => prod.productid === id);
    console.log(product);
    if (product) {
      res.send([product]);
    } else {
      res.status(404).send("Product not found.");
    }
  });
});
app.post("/svr/products", function (req, res) {
  console.log("Request Body:", req.body);
  let { productname, category, description } = req.body;
  let newProduct = {
    productname,
    category,
    description,
  };
  fs.readFile("products.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading products data:", err);
      res.status(500).send("An error occurred while inserting data.");
      return;
    }
    const products = JSON.parse(data);
    products.push({ ...newProduct, productid: products.length + 1 });
    fs.writeFile(
      "products.json",
      JSON.stringify(products, null, 2),
      "utf8",
      (err) => {
        if (err) {
          console.error("Error writing products data:", err);
          res.status(500).send("An error occurred while inserting data.");
        } else {
          res.send(`${products.length} insertion Successful`);
        }
      }
    );
  });
});
