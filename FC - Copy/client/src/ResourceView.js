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
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import uuid from "react-uuid";
import moment from "moment-jalaali";
import "imrc-datetime-picker/dist/imrc-datetime-picker.css";
import { DatetimePicker } from "imrc-datetime-picker";
import Multiselect from "multiselect-react-dropdown";
const axios = require("axios");

const ResourceView = () => {
  const calendarRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const format = "jYYYY/jM/jD HH:mm";
  const defaultState = {
    id: "",
    resourceId: 0,
    title: "",
    start: new Date(),
    end: new Date(),
    allDay: false,
    editable: true,
    isEdit: false,
    resourceEditable: false,
    description: "",
    operations: [],
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
    switch (event.resourceId) {
      case "1":
        event.color = "#AECDE1";
        event.textColor = "white";
        break;
      case "2":
        event.color = "#9DADCD";
        event.textColor = "white";
        break;
      case "3":
        event.color = "#93B3BB";
        event.textColor = "white";
        break;
      case "4":
        event.color = "#958DB1";
        event.textColor = "white";
        break;
      case "5":
        event.color = "#906C8D";
        event.textColor = "white";
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
        d.operations = defaultState.operations;
        return d;
      });
      setEventDuration({
        h: 0,
        m: 0,
      });
    });
  };

  const [resources, setResources] = useState([]);
  const fetchResources = () => {
    axios.get("http://localhost:4000/r").then((response) => {
      let res = response.data;
      setResources(res);
      res.map((e) => {
        let calendarApi = calendarRef.current.getApi();
        calendarApi.addResource({ id: e.resourceId, title: e.resourceName });
      });
    });
  };
  const resourceById = () => {
    resources.map((e) => {
      if (e.resourceId === event.resourceId) {
        resourceName = e.resourceName;
      }
    });
  };
  useEffect(() => {
    fetchEvents();
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [date, setDate] = useState(moment());

  const onDateClick = (e) => {
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
      d.description = defaultState.description;
      d.operations = defaultState.operations;
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
    setEvent((prev) => {
      let d = prev;
      d.id = e.event.id;
      d.resourceId = e.event._def.resourceIds[0];
      d.title = e.event.title;
      d.start = e.event.start;
      d.end = e.event.end;
      d.isEdit = true;
      d.description = e.event.extendedProps.description;
      d.operations = e.event.extendedProps.operations;
      return d;
    });
    setEventDuration((prev) => {
      let d = prev;
      let days = e.event.end.getDay() - e.event.start.getDay();
      d.h = e.event.end.getHours() - e.event.start.getHours() + days * 24;
      d.m = e.event.end.getMinutes() - e.event.start.getMinutes();
      return d;
    });
    console.log(event.description);
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
      .catch((error) => console.log(error));

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
    console.log(event);
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
          description: q.extendedProps.description,
          operations: q.extendedProps.operations,
        };
        console.log(tempQ);
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
        <i>{eventInfo.event.extendedProps.description}</i>
      </>
    );
  };
  moment.loadPersian({
    dialect: "persian-modern",
    usePersianDigits: true,
  });

  const [operations, setOperations] = useState([]);
  const fetchOperations = () => {
    axios.get("http://localhost:4000/o").then((response) => {
      setOperations(response.data);
    });
  };
  useEffect(() => {
    fetchOperations();
  }, [setModalOpen]);

  return (
    <>
      <div
        style={{
          backgroundColor: "#efefef",
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
          resourceAreaHeaderContent="کوره ها"
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
          <Modal.Header
            closeButton
            style={{ backgroundColor: "#efefef", direction: "rtl" }}
          >
            <Container>
              <Row>
                <Col>
                  <Modal.Title>انتخاب تاریخ</Modal.Title>
                </Col>
              </Row>
            </Container>
          </Modal.Header>
          <Modal.Body
            style={{
              width: "100%",
              margin: " auto",
              backgroundColor: "#efefef",
            }}
          >
            <DatetimePicker
              style={{
                margin: "auto",
                backgroundColor: "#efefef",
              }}
              moment={date}
              onChange={(e) => {
                setDate(e);
              }}
              showTimePicker={false}
              isSolar={true}
              lang="fa"
              Months={[
                "فروردین",
                "اردیبهشت",
                "خرداد",
                "تیر",
                "مرداد",
                "شهریور",
                "مهر",
                "آبان",
                "آذر",
                "دی",
                "بهمن",
                "اسفند",
              ]}
            />
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: "#efefef" }}>
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
          style={{
            fontFamily: "Sahel, Segoe UI",
          }}
          onEnter={resourceById()}
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
              d.description = defaultState.description;
              d.operations = defaultState.operations;
              return d;
            });
          }}
        >
          <Modal.Header closeButton style={{ direction: "rtl" }}>
            <Container>
              <Row>
                <Col>
                  <Modal.Title>{resourceName}</Modal.Title>
                </Col>
              </Row>
            </Container>
          </Modal.Header>
          <Modal.Body>
            <Form dir="rtl">
              <div>
                <div>
                  <label>عنوان</label>
                  <Form.Control
                    style={{ marginBottom: "10px" }}
                    type="input"
                    placeholder="عنوان"
                    value={event.title}
                    onChange={(e) => {
                      setEvent({ ...event, title: e.target.value });
                    }}
                  />
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label>عملیات</label>
                  <Multiselect
                    className={"multiSelectContainer"}
                    isObject={false}
                    options={operations}
                    avoidHighlightFirstOption={true}
                    selectedValues={event.operations}
                    placeholder={"جستجو..."}
                    closeOnSelect={false}
                    onSelect={(e) => {
                      setEvent({ ...event, operations: e });
                    }}
                    onRemove={(e) => {
                      setEvent({ ...event, operations: e });
                    }}
                  ></Multiselect>
                </div>
                <div>
                  <label>توضیحات</label>
                  <Form.Control
                    style={{ marginBottom: "10px" }}
                    type="input"
                    placeholder="توضیحات"
                    value={event.description}
                    onChange={(e) => {
                      setEvent({ ...event, description: e.target.value });
                      console.log(event.description);
                    }}
                  />
                </div>
                <label>مدت</label>

                <div style={{ display: "flex" }}>
                  <div style={{ display: "flex" }}>
                    <Form.Control
                      style={{
                        width: "40%",
                        marginLeft: "10px",
                      }}
                      type="number"
                      min="1"
                      name="hours"
                      id="hours"
                      value={eventDuration.h}
                      placeholder="ساعت"
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
                    <p
                      style={{
                        display: "flex",
                        width: "30%",
                      }}
                    >
                      ساعت
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "50%",
                    }}
                  >
                    <Form.Control
                      style={{
                        width: "40%",
                        marginLeft: "10px",
                      }}
                      type="number"
                      min="0"
                      step="30"
                      max="30"
                      name="minutes"
                      id="minutes"
                      placeholder="دقیقه"
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
                    <p
                      style={{
                        display: "flex",
                        width: "70%",
                      }}
                    >
                      دقیقه
                    </p>
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
                    ثبت تغییرات
                  </Button>
                </>
              ) : (
                <Button
                  variant="success"
                  onClick={(e) => {
                    onAdd(e);
                  }}
                >
                  اضافه کردن
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
