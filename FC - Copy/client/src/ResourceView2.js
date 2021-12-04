/* eslint-disable array-callback-return */
import React from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useRef, useEffect } from "react";
import * as data from "./Data/data.json";
import "moment/locale/fa";
import { Modal, Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import uuid from "react-uuid";
import moment from "moment-jalaali";
import "imrc-datetime-picker/dist/imrc-datetime-picker.css";
import { DatetimePicker } from "imrc-datetime-picker";
// import Multiselect from "multiselect-react-dropdown";
const axios = require("axios");

const ResourceView = () => {
  const calendarRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const format = "jYYYY/jM/jD HH:mm";
  const defaultState = {
    id: "",
    resourceId: "",
    title: "",
    start: new Date(),
    end: new Date(),
    allDay: false,
    editable: true,
    isEdit: false,
    resourceEditable: false,
    description: "",
    extendedProps: {
      priority: "Medium",
    },
  };
  const [event, setEvent] = useState(defaultState);
  const [eventDuration, setEventDuration] = useState({
    h: 0,
    m: 0,
  });
  const defaultGap = data.defaultGap;
  let resourceName;

  const plugins = [resourceTimelinePlugin, interactionPlugin];
  const setColor = (event) => {
    switch (event.extendedProps.priority) {
      case "Very High":
        event.color = "red";
        break;
      case "High":
        event.color = "orange";
        break;
      case "Medium":
        event.color = "yellow";
        event.textColor = "black";
        break;
      case "Low":
        event.color = "yellowgreen";
        event.textColor = "black";
        break;
      case "Very Low":
        event.color = "#007fff";
        break;

      default:
        break;
    }
  };
  const fetchEvents = () => {
    axios.get("http://localhost:4000/e").then((response) => {
      const res = response.data;
      res.map((e) => {
        setColor(e);
        let calendarApi = calendarRef.current.getApi();
        calendarApi.addEvent(e);
      });

      setEvent((prev) => {
        let d = prev;
        d.id = defaultState.id;
        d.resourceId = defaultState.resourceId;
        d.title = defaultState.title;
        d.start = defaultState.start;
        d.end = defaultState.end;
        d.resourceEditable = false;
        d.isEdit = false;
        d.description = defaultState.description;
        let a = prev.extendedProps;
        a.priority = defaultState.extendedProps.priority;
        d.extendedProps = a;
        return d;
      });
      setEventDuration({
        h: 0,
        m: 0,
      });
    });
  };
  //   let resources = [];
  const fetchResources = () => {
    axios.get("http://localhost:4000/r").then((response) => {
      let res = response.data;
      res.map((e) => {
        let calendarApi = calendarRef.current.getApi();
        calendarApi.addResource({ id: e.resourceId, title: e.resourceName });
      });
    });
  };
  //   const resourceById = () => {
  // let calendarApi = calendarRef.current.getApi();
  // let resources = calendarRef.current.getApi().getResources();
  // console.log(resources);

  // resources.map((e) => {
  //   if (e.resourceId === event.resourceId) {
  //     resourceName = e.resourceName;
  //   }
  // });
  //   };
  useEffect(() => {
    fetchEvents();
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //   useEffect(() => {
  //     resourceName = resources;
  //     return () => {
  //       resourceName = "";
  //     };
  //   }, [setModalOpen]);

  const [date, setDate] = useState(moment());

  const onDateClick = (e) => {
    resourceName = e.resource._resource.title;
    // console.log(resourceName);
    const date = e.date;
    setEvent((prev) => {
      let d = prev;
      d.id = uuid();
      d.resourceId = e.resource._resource.id;
      d.title = defaultState.title;
      d.start = date;
      d.end = moment(date).add(1, "h")._d;
      d.isEdit = false;
      d.resourceEditable = false;
      let a = prev.extendedProps;
      a.priority = defaultState.extendedProps.priority;
      d.extendedProps = a;
      return d;
    });
    setEventDuration((prev) => {
      let d = prev;
      d.h = 1;
      d.m = 0;
      return d;
    });
    setModalOpen(true);
  };

  const onEventClick = (e) => {
    // console.log(e);
    setEvent((prev) => {
      let d = prev;
      d.id = e.event.id;
      d.resourceId = e.event._def.resourceIds[0];
      d.title = e.event.title;
      d.start = e.event.start;
      d.end = e.event.end;
      d.isEdit = true;
      d.description = e.event.extendedProps.description;
      let a = prev.extendedProps;
      a.priority = e.event.extendedProps.priority;
      //   a.description = e.event.extendedProps.description;
      d.extendedProps = a;
      return d;
    });
    setEventDuration((prev) => {
      let d = prev;
      let days = e.event.end.getDay() - e.event.start.getDay();
      d.h = e.event.end.getHours() - e.event.start.getHours() + days * 24;
      d.m = e.event.end.getMinutes() - e.event.start.getMinutes();
      return d;
    });
    console.log(event);
    setModalOpen(true);
  };

  const onAdd = (e) => {
    e.preventDefault();
    setColor(event);
    let newEnd = moment(event.start)
      .add(eventDuration.h, "h")
      .add(eventDuration.m, "m");
    setEvent((prev) => {
      let d = prev;
      d.end = newEnd._d;
      d.resourceEditable = false;
      return d;
    });
    let calendarApi = calendarRef.current.getApi();
    calendarApi.addEvent(event);
    axios
      .post("http://localhost:4000/create", event)
      .catch((error) => console.log(error))
      .then(() => {
        calendarApi.addEvent(event);
      });
    setModalOpen(false);
    rearrangeDates(defaultGap, event.resourceId);
  };

  const onEdit = (e) => {
    e.preventDefault();
    setColor(event);
    let newEnd = moment(event.start)
      .add(eventDuration.h, "h")
      .add(eventDuration.m, "m");
    setEvent((prev) => {
      let d = prev;
      d.end = newEnd._d;
      return d;
    });
    let calendarApi = calendarRef.current.getApi();
    calendarApi.getEventById(event.id).remove();
    calendarApi.addEvent(event);

    setModalOpen(false);
    rearrangeDates(defaultGap, event.resourceId);
  };

  const onDrop = (e) => {
    if (e.oldResource !== e.newResource) {
      e.revert();
    }

    let calendarApi = calendarRef.current.getApi();
    calendarApi.getEventById(e.event.id).setDates(e.event.start, e.event.end);
    rearrangeDates(defaultGap, e.event._def.resourceIds[0]);
  };

  const onResize = (e) => {
    let calendarApi = calendarRef.current.getApi();
    calendarApi.getEventById(e.event.id).setDates(e.startDelta, e.endDelta);
    rearrangeDates(defaultGap, e.event._def.resourceIds[0]);
  };

  const rearrangeDates = (defaultGap, resourceId) => {
    let calendarApi = calendarRef.current.getApi();
    let res = calendarApi.getResourceById(resourceId);
    let eventsArray = res.getEvents();
    eventsArray.sort((a, b) => {
      return a.start - b.start;
    });

    for (let i = 0; i < eventsArray.length; i++) {
      if (i === 0) {
        let a = eventsArray[0];
        axios
          .put("http://localhost:4000/edit/", a)
          .catch((error) => console.log(error))
          .then((response) => {
            if (response.status === 200) {
            } else {
              console.log("not received");
            }
          });
      } else {
        let p = calendarApi.getEventById(eventsArray[i - 1].id);
        let q = calendarApi.getEventById(eventsArray[i].id);
        let x = moment(p.end).add(defaultGap, "h")._d;
        if (x !== q.end) {
          q.setStart(x, { maintainDuration: true });
        }

        const tempQ = {
          id: q.id,
          resourceId: q._def.resourceIds[0],
          title: q.title,
          start: q.start,
          end: q.end,
          allDay: false,
          editable: true,
          resourceEditable: false,
          isEdit: false,
          extendedProps: {
            priority: q.extendedProps.priority,
          },
        };
        axios
          .put("http://localhost:4000/edit/", tempQ)
          .catch((error) => console.log(error))
          .then((response) => {
            if (response.status === 200) {
            } else {
              console.log("not received");
            }
          });
      }
    }
  };

  const renderEventContent = (eventInfo) => {
    return (
      <>
        <i>{eventInfo.event.title}</i>
        <i>-</i>
        <i>{eventInfo.event.extendedProps.priority}</i>
      </>
    );
  };
  moment.loadPersian({
    dialect: "persian-modern",
    usePersianDigits: true,
  });

  return (
    <>
      <div
        style={{
          display: "block",
          position: "relative",
          padding: "1%",
          zIndex: "0",
          fontFamily: "Sahel, Segoe UI",
        }}
      >
        <FullCalendar
          plugins={plugins}
          ref={calendarRef}
          locale="fa"
          direction="rtl"
          initialView="resourceTimelineWeek"
          customButtons={{
            goTo: {
              text: "برو به...",
              click: () => {
                setDateModalOpen(true);
              },
            },
          }}
          headerToolbar={{
            left: "goTo",
            center: "title",
            right: "prev,next,today",
          }}
          buttonText={{
            today: "امروز",
          }}
          //   businessHours={{
          //     daysOfWeek: [1, 2, 3, 6, 7],

          //     startTime: "08:00",
          //     endTime: "20:00",
          //   }}
          editable={true}
          droppable={true}
          height="auto"
          resourceAreaHeaderContent="Furnaces"
          resourceAreaWidth="150px"
          forceEventDuration={true}
          eventResourceEditable={false}
          defaultTimedEventDuration="00:30"
          eventContent={renderEventContent}
          dateClick={(e) => onDateClick(e)}
          eventClick={(e) => {
            onEventClick(e);
          }}
          eventDrop={(e) => onDrop(e)}
          eventResize={(e) => {
            onResize(e);
          }}
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        />
        <Modal
          show={dateModalOpen}
          onHide={() => setDateModalOpen(false)}
          style={{
            fontFamily: "Sahel, Segoe UI",
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>انتخاب تاریخ</Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              margin: "auto",
            }}
          >
            <DatetimePicker
              moment={date}
              onChange={(e) => {
                setDate(e);
              }}
              closeOnSelectDay={true}
              showTimePicker={false}
              isSolar={true}
              lang="fa"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={(e) => {
                calendarRef.current.getApi().gotoDate(date._d);
                setDateModalOpen(false);
              }}
            >
              برو
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={modalOpen}
          //   onEnter={resourceById()}
          onHide={() => {
            setModalOpen(false);
            setEvent((prev) => {
              let d = prev;
              d.id = defaultState.id;
              d.resourceId = defaultState.resourceId;
              d.title = defaultState.title;
              d.start = defaultState.start;
              d.end = defaultState.end;
              d.isEdit = false;
              let a = prev.extendedProps;
              a.priority = defaultState.extendedProps.priority;
              d.extendedProps = a;
              return d;
            });
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>{resourceName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form dir="rtl">
              <div>
                <div>
                  <label>Title</label>
                  <Form.Control
                    type="input"
                    placeholder="Event Title"
                    value={event.title}
                    onChange={(e) => {
                      setEvent({ ...event, title: e.target.value });
                      console.log(event.title);
                    }}
                  />
                </div>
                <div>
                  <label>Priority</label>
                  {/* <Multiselect
                    isObject={false}
                    options={pros}
                    avoidHighlightFirstOption={true}
                    showArrow={true}
                  >
                    {data.priorities.map((p) => pros.push(p.title))}
                  </Multiselect> */}
                  <Form.Select
                    aria-label="Default select example"
                    className="selectpicker"
                    multiple={false}
                    value={event.extendedProps.priority}
                    onChange={(e) => {
                      setEvent({
                        ...event,
                        extendedProps: {
                          ...event.extendedProps,
                          priority: e.target.value,
                        },
                      });
                      console.log(event.extendedProps.priority);
                    }}
                  >
                    {data.priorities.map((p) => {
                      return (
                        <option key={p.id} value={p.title}>
                          {p.title}
                        </option>
                      );
                    })}
                  </Form.Select>
                </div>
                <label>Duration</label>

                <div style={{ display: "flex", width: "100%" }}>
                  <div style={{ display: "flex", width: "50%" }}>
                    <Form.Control
                      type="number"
                      min="1"
                      name="hours"
                      id="hours"
                      value={eventDuration.h}
                      placeholder="Hours"
                      onChange={(e) => {
                        setEventDuration((prev) => {
                          let d = prev;
                          d.h = e.target.value;
                          return d;
                        });
                        setEventDuration({
                          ...eventDuration,
                          h: e.target.value,
                        });
                        console.log(eventDuration);
                        console.log(moment(event.end).format(format));
                      }}
                    />
                    <p>Hours</p>
                  </div>
                  <div style={{ display: "flex", width: "50%" }}>
                    <Form.Control
                      type="number"
                      min="0"
                      step="30"
                      max="30"
                      name="minutes"
                      id="minutes"
                      placeholder="Minutes"
                      value={eventDuration.m}
                      onChange={(e) => {
                        setEventDuration((prev) => {
                          let d = prev;
                          d.m = e.target.value;
                          return d;
                        });
                        setEventDuration({
                          ...eventDuration,
                          m: e.target.value,
                        });
                        console.log(eventDuration);
                        console.log(moment(event.end).format(format));
                      }}
                    />
                    <p>Minutes</p>
                  </div>
                </div>
              </div>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <div>
              {event.isEdit ? (
                <>
                  <Button variant="primary" onClick={(e) => onEdit(e)}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="success"
                  onClick={(e) => {
                    onAdd(e);
                  }}
                >
                  Add Event
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default ResourceView;
