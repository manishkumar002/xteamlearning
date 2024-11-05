require("dotenv").config();
const express = require("express");
const multer = require("multer");
const con = require("./config");
const app = express();
const cors = require("cors");
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cors());

//------------------------get category--------------------------------
app.get("/get_category", (req, resp) => {
  con.query(
    "SELECT bpc.category_id, bc.category_name,bc.meta_title,bc.meta_keywords,bc.meta_description, count(bpc.category_id) as posts_count FROM `blog_category` bc left join blog_post_category bpc on bpc.category_id = bc.category_id GROUP BY bc.category_name;",
    (err, result) => {
      if (err) {
        resp.send("error in api");
      } else {
        resp.send(result);
      }
    }
  );
});

//----------------------------get data--2-------------------------------
app.get("/getdata", (req, resp) => {
  const category_id = req?.query?.key;
  const tag_id = req?.query?.tag;
  const year_id = req?.query?.year;
  const month_id = req?.query?.month;
  let qry = `
    SELECT
    bp.*,
    GROUP_CONCAT(DISTINCT bbt.tag_name) AS tags,
    users.name
    FROM
    blog_posts bp
    LEFT JOIN blog_post_tags bppt ON bp.post_id = bppt.post_id
    LEFT JOIN blog_tags bbt ON bbt.tag_id = bppt.tag_id
    JOIN users ON users.id = bp.created_by`;

  if (category_id) {
    qry += `
      JOIN  blog_post_category bpc ON bpc.post_id = bp.post_id
      WHERE bpc.category_id = ${category_id}`;
  }
  if (tag_id) {
    qry += `
      WHERE bppt.tag_id = ${tag_id}`;
  }
  if (year_id && month_id) {
    let month = parseInt(month_id);

    let date = 30;
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      date = 31;
    } else if (month == 2) {
      if ((year_id % 4 == 0 && year_id % 100 !== 0) || year_id % 400 == 0) {
        date = 29;
      } else {
        date = 28;
      }
    } else {
      date = 30;
    }
    qry += ` WHERE bp.published_date >= '${year_id}-0${month}-01' && bp.published_date <= '${year_id}-0${month}-${date}'`;
  }

  qry += " GROUP BY bp.post_id";

  // console.log(qry)
  con.query(qry, (err, result) => {
    if (err) {
      console.error("Error in API:", err);
      resp.status(500).send("Error in API");
    } else {
      resp.json(result);
    }
  });
});

app.get("/metagetdata", (req, resp) => {
  const first_id = req?.query?.fid;
  console.log(first_id);
  const second_id = req?.query?.sid;
  console.log(second_id);
  con.query("select * from blog_posts", (err, result) => {
    if (err) {
      resp.send("error in api");
    } else {
      resp.send(result);
    }
  });
});

//---------------------------------get tag---------------------------------
app.get("/tag", (req, resp) => {
  con.query(
    "SELECT bpc.tag_id, bc.tag_name, count(bpc.tag_id) as posts_count FROM `blog_tags` bc left join blog_post_tags bpc on bpc.tag_id = bc.tag_id GROUP BY bc.tag_id",
    (err, result) => {
      if (err) {
        resp.send("error in api");
      } else {
        resp.send(result);
      }
    }
  );
});

//  -------------------------------get Readmore-------------------------

app.get("/readmore", (req, resp) => {
  con.query(
    "SELECT bp.*,GROUP_CONCAT(DISTINCT bbt.tag_name) ab, users.name FROM blog_posts bp JOIN blog_post_tags bppt ON bp.post_id = bppt.post_id JOIN blog_tags bbt ON bbt.tag_id = bppt.tag_id JOIN users ON users.id = bp.created_by GROUP BY bp.post_id;",
    (err, result) => {
      if (err) {
        resp.send("error in api");
      } else {
        resp.send(result);
      }
    }
  );
});

// .......................................comment_post..........................................
app.post("/comment", (req, resp) => {
  const data = req.body;
  con.query(
    "INSERT INTO blog_post_comments SET?",
    data,
    (error, results, fields) => {
      if (error) throw error;
      resp.send(results);
    }
  );
});

//.............................................get Comments.............................................

app.get("/comments", (req, resp) => {
  con.query("select * from blog_post_comments", (err, result) => {
    if (err) {
      resp.send("error in api");
    } else {
      resp.send(result);
    }
  });
});

// ----------------------------------------getdata tutorial---------------------------------------
app.get("/getseries", (req, resp) => {
  const technology_id = req?.query?.key;

  let qry =
    "SELECT bt.tutorial_series_name,bt.tutorial_series_image_b64,bt.tutorial_series_description, COUNT(btt.tutorial_series_id) as lessons_count, GROUP_CONCAT(DISTINCT btt1.technology_name) as technologies FROM tutorial_series bt LEFT JOIN tutorial_series_lessons btts ON btts.tutorial_series_id = bt.tutorial_series_id LEFT JOIN tutorial_series_technology btt ON btt.tutorial_series_id = bt.tutorial_series_id LEFT JOIN technology btt1 ON btt1.technology_id = btt.technology_id";

  if (technology_id) {
    qry += ` WHERE btt.technology_id = ${technology_id}`;
  }

  qry += " GROUP BY bt.tutorial_series_name;";

  con.query(qry, (err, result) => {
    if (err) {
      resp.send("error in API");
    } else {
      resp.send(result);
    }
  });
});

//  ---------------------get tutorial---------------

app.get("/tutorial", (req, resp) => {
  con.query(
    "SELECT tutorial_series_name,tutorial_series_description,tutorial_series_image_b64,lesson_id, lesson_title FROM tutorial_series LEFT JOIN tutorial_series_lessons ON tutorial_series.tutorial_series_id = tutorial_series_lessons.tutorial_series_id;",
    (err, result) => {
      if (err) {
        resp.send("error in api");
      } else {
        resp.send(result);
      }
    }
  );
});

app.get("/tutorials", (req, resp) => {
  const lesson_id = req?.query?.key;
  const query = `SELECT * FROM tutorial_series_lessons tsl WHERE tsl.status = 1 AND tsl.tutorial_series_id = (SELECT tsl1.tutorial_series_id FROM tutorial_series_lessons tsl1 WHERE tsl1.lesson_id = ${lesson_id})`;
  con.query(query, (err, result) => {
    if (err) {
      console.error(err);
      resp.status(500).send("Error in API");
    } else {
      resp.json(result);
    }
  });
});

//....................get technology...........................
app.get("/technology", (req, resp) => {
  con.query(
    "SELECT bpc.technology_id, bc.technology_name, count(bpc.technology_id) as technology_count FROM `technology` bc left join tutorial_series_technology bpc on bpc.technology_id = bc.technology_id GROUP BY bc.technology_name;",
    (err, result) => {
      if (err) {
        resp.send("error in api");
      } else {
        resp.send(result);
      }
    }
  );
});

//....................get lession...........................
app.get("/lession", (req, resp) => {
  con.query("select * from tutorial_series_lessons", (err, result) => {
    if (err) {
      resp.send("error in api");
    } else {
      resp.send(result);
    }
  });
});

// ---------------------getSerise---------------------------

app.get("/series/:key", async (req, res) => {
  try {
    const searchQuery = `%${req.params.key}%`;
    const sql =
      "SELECT * FROM blog_tutorialseries WHERE tutorial_series_name LIKE ?";

    con.query(sql, [searchQuery], (err, results) => {
      if (err) {
        console.error("Error executing the SQL query:", err);
        return res
          .status(500)
          .json({ error: "An error occurred while processing your request." });
      }

      const rows = results || [];
      res.status(200).json(rows);
    });
  } catch (error) {
    console.error("Error in try-catch block:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

app.get("/series/:key", async (req, res) => {
  try {
    const searchQuery = `%${req.params.key}%`;

    // Query to select data from blog_tutorialseries
    const seriesSql =
      "SELECT * FROM blog_tutorialseries WHERE tutorial_series_name LIKE ?";
    con.query(seriesSql, [searchQuery], (seriesErr, seriesResults) => {
      if (seriesErr) {
        console.error(
          "Error executing the SQL query for blog_tutorialseries:",
          seriesErr
        );
        return res
          .status(500)
          .json({ error: "An error occurred while processing your request." });
      }

      // Query to select data from blog_post
      const postSql = "SELECT * FROM blog_post WHERE post_title LIKE ?";
      con.query(postSql, [searchQuery], (postErr, postResults) => {
        if (postErr) {
          console.error(
            "Error executing the SQL query for blog_post:",
            postErr
          );
          return res.status(500).json({
            error: "An error occurred while processing your request.",
          });
        }

        const seriesData = seriesResults || [];
        const postData = postResults || [];

        // Combine data from both queries and send as a response
        const combinedData = {
          seriesData: seriesData,
          postData: postData,
        };

        res.status(200).json(combinedData);
      });
    });
  } catch (error) {
    console.error("Error in try-catch block:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

app.listen(process.env.PORT, (req, res) => {
  console.log("server start");
});
