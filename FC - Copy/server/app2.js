const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
const resources = [
  {
    resourceId: "1",
    resourceName: "Furnace1",
  },
  {
    resourceId: "2",
    resourceName: "Furnace2",
  },
  {
    resourceId: "3",
    resourceName: "Furnace3",
  },
  {
    resourceId: "4",
    resourceName: "Furnace4",
  },
  {
    resourceId: "5",
    resourceName: "Furnace5",
  },
];
const events = [
  {
    id: "1",
    resourceId: "1",
    title: "event 1",
    start: "2021-11-28",
    end: "2021-11-29",
    allDay: false,
    editable: true,
    isEdit: false,
    resourceEditable: false,
    description: "event 1 description",
    extendedProps: {
      priority: "Low",
    },
  },
  {
    id: "2",
    resourceId: "2",
    title: "event 2",
    start: "2021-11-28",
    end: "2021-11-29",
    allDay: false,
    editable: true,
    isEdit: false,
    resourceEditable: false,
    description: "event 2 description",
    extendedProps: {
      priority: "High",
    },
  },
  {
    id: "3",
    resourceId: "3",
    title: "event 3",
    start: "2021-11-29",
    end: "2021-11-30",
    allDay: false,
    editable: true,
    isEdit: false,
    resourceEditable: false,
    description: "event 3 description",
    extendedProps: {
      priority: "Very Low",
    },
  },
];

app.get("/e", (req, res) => {
  res.send(events);
});

app.get("/r", (req, res) => {
  res.send(resources);
});

app.post("/create", (req, res) => {
  const newEvent = {
    id: req.body.id,
    resourceId: req.body.resourceId,
    title: req.body.title,
    start: req.body.start,
    end: req.body.end,
    allDay: false,
    editable: true,
    isEdit: false,
    extendedProps: {
      priority: req.body.extendedProps.priority,
    },
  };
  events.push(newEvent);
});

app.put("/edit", (req, res) => {
  let edited = req.body;
  events.map((e) => {
    if (e.id === edited.id) {
      console.log("matched");
      e.title = edited.title;
      e.start = edited.start;
      e.end = edited.end;
      e.extendedProps.priority = edited.extendedProps.priority;
      return;
    }
  });
  res.send();
});

app.listen(port, () => {
  console.log(` now listening at http://localhost:${port}`);
});
