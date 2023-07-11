const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("loadsh");
const { name } = require("ejs");
const date = require(__dirname + "/date.js");

const app = express();
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

app.get('/favicon.ico', (req, res) => res.status(204));
const  listsSchema = {
  name: String
};

const Item = mongoose.model("item", listsSchema);
const item1 = new Item({name: "Welcome to new ToDoList"});
const item2 = new Item({name: "Add new items using +"});
const item3 = new Item({name: "Remove items using checkbox"});
var defaultItems = [item1, item2, item3];

const customListSchema = {
  name: String,
  customListItem: [listsSchema]
};

const List = mongoose.model("list", customListSchema);
let newListNames = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
 
app.get("/", function(req, res) {
  const day = date.getDate();
  async function f() {
    const found = await Item.find({});
    if(found.length === 0) {
      await Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", {listTitle: day, newListItems: found, navbarList: newListNames});
    }
  } f();
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const listName = _.capitalize(req.body.list);
  const listNameIn = _.capitalize(req.body.newListIn);
  
  const newList = new Item({
    name:item
  });
  if(!listNameIn) {
    async function f() {
      const findList = await List.findOne({name:listName});
      if(findList) {
        findList.customListItem.push(newList);
        await findList.save();
        res.redirect("/" + listName);
      } else {
        newList.save();
        res.redirect("/");
      }
    } f();
  } else {
    res.redirect("/" + listNameIn);
  }
});

app.post("/delete", function(req, res) {
  const delItemId = req.body.checkbox;
  const listName = req.body.listName;
  const delList = req.body.deleteList;

  if(delList) {
    async function delButton() {
      const deleteList = await List.findOneAndDelete({name: delList}, {returnOriginal: false});
      if(deleteList) {
      newListNames = newListNames.filter(name => name !== delList);
      res.redirect("/")
    }
    } delButton();
  } else {
    async function dl() {
      const delItem = await List.findOneAndUpdate(
        {name: listName}, 
        {$pull: {customListItem: {_id: delItemId}}}, 
        {returnOriginal: false}
      );
      if(delItem) {
        res.redirect("/" + listName);
      } else {
        await Item.findByIdAndRemove(delItemId);
        res.redirect("/");
      }
    } dl();
  }
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  async function f() {
    const foundList = await List.findOne({name: customListName});
    if(!foundList) {
      const list = new List({
        name: customListName,
        customListItem: defaultItems
      });
      await list.save();
      newListNames.push(customListName);
      res.redirect("/" + customListName);
    } else {
      async function af() {
        const find = await List.find({});
        res.render("list", {listTitle: foundList.name, newListItems: foundList.customListItem, navbarList: newListNames});
      } af();
    }
  } f();
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});