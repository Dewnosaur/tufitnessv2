const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;
const db = new sqlite3.Database('mydatabase.db');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER,
    name VARCHAR(20),
    price REAL,
    description VARCHAR(1000),
    duration INTEGER,
    picture TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(30),
    password VARCHAR(20),
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    tel VARCHAR(20),
    date_of_birth DATETIME,
    id_card_number INTEGER,
    member_type VARCHAR
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subscription (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    customer INTEGER,
    payment INTEGER,
    end_date DATETIME,
    FOREIGN KEY(product_id) REFERENCES product(id),
    FOREIGN KEY(customer) REFERENCES user(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_owner INTEGER,
    method VARCHAR(255),
    date DATETIME,
    picture TEXT -- Storing image path
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS promotion (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Added ID for easier management
    start_date DATETIME,
    end_date DATETIME,
    promotion_product INTEGER,
    discount_percent REAL,
    discount_code VARCHAR(7),
    FOREIGN KEY(promotion_product) REFERENCES product(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Added ID for easier management
    contact_name VARCHAR(100),
    contact_email VARCHAR(50),
    contact_tel VARCHAR(10),
    title VARCHAR(100),
    detail VARCHAR(500)
  )`);
});

// Generic function for GET all records from a table
const getAll = (tableName, req, res) => {
  db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

// Generic function for GET single record by ID from a table
const getById = (tableName, req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ message: `${tableName} not found` });
      return;
    }
    res.json(row);
  });
};

// Generic function for DELETE record by ID from a table
const deleteById = (tableName, req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ message: `${tableName} not found` });
      return;
    }
    res.json({ message: `${tableName} deleted successfully` });
  });
};

// PRODUCT Endpoints
app.get('/api/products', (req, res) => getAll('product', req, res));
app.get('/api/products/:id', (req, res) => getById('product', req, res));

app.post('/api/products', (req, res) => {
  const { package_id, name, price, description, duration, picture } = req.body;
  db.run(
    `INSERT INTO product (package_id, name, price, description, duration, picture) VALUES (?, ?, ?, ?, ?, ?)`,
    [package_id, name, price, description, duration, picture],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const { package_id, name, price, description, duration, picture } = req.body;
  db.run(
    `UPDATE product SET package_id = ?, name = ?, price = ?, description = ?, duration = ?, picture = ? WHERE id = ?`,
    [package_id, name, price, description, duration, picture, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

app.delete('/api/products/:id', (req, res) => deleteById('product', req, res));

// USER Endpoints
app.get('/api/users', (req, res) => getAll('user', req, res));
app.get('/api/users/:id', (req, res) => getById('user', req, res));

app.post('/api/users', (req, res) => {
  const { email, password, firstname, lastname, tel, date_of_birth, id_card_number, member_type } = req.body;
  db.run(`INSERT INTO user (email, password, firstname, lastname, tel, date_of_birth, id_card_number, member_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [email, password, firstname, lastname, tel, date_of_birth, id_card_number, member_type], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const { email, password, firstname, lastname, tel, date_of_birth, id_card_number, member_type } = req.body;
  db.run(`UPDATE user SET email = ?, password = ?, firstname = ?, lastname = ?, tel = ?, date_of_birth = ?, id_card_number = ?, member_type = ? WHERE id = ?`,
    [email, password, firstname, lastname, tel, date_of_birth, id_card_number, member_type, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json({ message: 'User updated successfully' });
    });
});

app.delete('/api/users/:id', (req, res) => deleteById('user', req, res));

// SUBSCRIPTION Endpoints
app.get('/api/subscriptions', (req, res) => getAll('subscription', req, res));
app.get('/api/subscriptions/:id', (req, res) => getById('subscription', req, res));

app.post('/api/subscriptions', (req, res) => {
  const { product_id, customer, payment, end_date } = req.body;
  db.run(`INSERT INTO subscription (product_id, customer, payment, end_date) VALUES (?, ?, ?, ?)`,
    [product_id, customer, payment, end_date], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/subscriptions/:id', (req, res) => {
  const id = req.params.id;
  const { product_id, customer, payment, end_date } = req.body;
  db.run(`UPDATE subscription SET product_id = ?, customer = ?, payment = ?, end_date = ? WHERE id = ?`,
    [product_id, customer, payment, end_date, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: 'Subscription not found' });
        return;
      }
      res.json({ message: 'Subscription updated successfully' });
    });
});

app.delete('/api/subscriptions/:id', (req, res) => deleteById('subscription', req, res));

// PAYMENT Endpoints
app.get('/api/payments', (req, res) => getAll('payment', req, res));
app.get('/api/payments/:id', (req, res) => getById('payment', req, res));

app.post('/api/payments', upload.single('picture'), (req, res) => {
  const { payment_owner, method, date } = req.body;
  const picturePath = req.file ? req.file.path : null;

  db.run(`INSERT INTO payment (payment_owner, method, date, picture) VALUES (?, ?, ?, ?)`,
    [payment_owner, method, date, picturePath], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, picture: picturePath });
    });
});

app.put('/api/payments/:id', upload.single('picture'), (req, res) => {
  const id = req.params.id;
  const { payment_owner, method, date } = req.body;
  const picturePath = req.file ? req.file.path : null;

  let sql = `UPDATE payment SET payment_owner = ?, method = ?, date = ?`;
  const params = [payment_owner, method, date];

  if (picturePath) {
    sql += `, picture = ?`;
    params.push(picturePath);
  }

  sql += ` WHERE id = ?`;
  params.push(id);

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    res.json({ message: 'Payment updated successfully', picture: picturePath });
  });
});

app.delete('/api/payments/:id', (req, res) => {
  const id = req.params.id;
  // Optional: Delete the associated image file
  db.get(`SELECT picture FROM payment WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error("Error fetching payment for image deletion:", err.message);
    }
    if (row && row.picture) {
      fs.unlink(row.picture, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting image file:", unlinkErr);
        }
      });
    }
  });

  deleteById('payment', req, res);
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// PROMOTION Endpoints
app.get('/api/promotions', (req, res) => getAll('promotion', req, res));
app.get('/api/promotions/:id', (req, res) => getById('promotion', req, res));

app.post('/api/promotions', (req, res) => {
  const { start_date, end_date, promotion_product, discount_percent, discount_code } = req.body;
  db.run(`INSERT INTO promotion (start_date, end_date, promotion_product, discount_percent, discount_code) VALUES (?, ?, ?, ?, ?)`,
    [start_date, end_date, promotion_product, discount_percent, discount_code], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/promotions/:id', (req, res) => {
  const id = req.params.id;
  const { start_date, end_date, promotion_product, discount_percent, discount_code } = req.body;
  db.run(`UPDATE promotion SET start_date = ?, end_date = ?, promotion_product = ?, discount_percent = ?, discount_code = ? WHERE id = ?`,
    [start_date, end_date, promotion_product, discount_percent, discount_code, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: 'Promotion not found' });
        return;
      }
      res.json({ message: 'Promotion updated successfully' });
    });
});

app.delete('/api/promotions/:id', (req, res) => deleteById('promotion', req, res));

// CONTACT Endpoints
app.get('/api/contacts', (req, res) => getAll('contact', req, res));
app.get('/api/contacts/:id', (req, res) => getById('contact', req, res));

app.post('/api/contacts', (req, res) => {
  const { contact_name, contact_email, contact_tel, title, detail } = req.body;
  db.run(`INSERT INTO contact (contact_name, contact_email, contact_tel, title, detail) VALUES (?, ?, ?, ?, ?)`,
    [contact_name, contact_email, contact_tel, title, detail], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/contacts/:id', (req, res) => {
  const id = req.params.id;
  const { contact_name, contact_email, contact_tel, title, detail } = req.body;
  db.run(`UPDATE contact SET contact_name = ?, contact_email = ?, contact_tel = ?, title = ?, detail = ? WHERE id = ?`,
    [contact_name, contact_email, contact_tel, title, detail, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: 'Contact not found' });
        return;
      }
      res.json({ message: 'Contact updated successfully' });
    });
});

app.delete('/api/contacts/:id', (req, res) => deleteById('contact', req, res));

// LOGIN Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(
    `SELECT * FROM user WHERE email = ? AND password = ?`,
    [email, password],
    (err, user) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      // You can return user info here, but avoid sending password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});