import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CropOriginalIcon from '@mui/icons-material/CropOriginal';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ShortTextIcon from '@mui/icons-material/ShortText';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { Accordion, Button, FormControlLabel, IconButton, MenuItem, Select, Switch, Tooltip, Typography } from "@mui/material";
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { useEffect, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useParams } from 'react-router-dom';
import { Question } from "../../utils/Question";
import useAxios from '../../utils/axios';
import { HTTP_METHODS, QUESTION_TYPES, REQUEST_URLS } from "../../utils/constants";
import "./QuestionUI.scss";
import { getCurrentDateTime } from '../../utils/util';
import { useQuestionPaper } from '../contexts/questionPaperContext';
import CreateIcon from '@mui/icons-material/Create';
import toast from 'react-hot-toast';

export function QuestionForm() {
  const { questionPaper, setQuestionPaper } = useQuestionPaper();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [yoffset, setYOffset] = useState(0);
  const [currQueIdx, setCurQueIdx] = useState(0);
  const [documentName, setDocName] = useState("untitled Document");
  const [documentDescription, setDocDesc] = useState("Add Description");
  const inputRefs = useRef<HTMLInputElement[] | any>([]);
  const divRef = useRef<HTMLInputElement[] | any>(null);
  let params = useParams();
  let HttpRequestController = useAxios();

  useEffect(() => {
    toast.promise(
      getAllQuestions(),
      {
        loading: 'Saving...',
        success: 'Questions loaded successfully',
        error: 'System error, Questions not loaded..!'
      }
    );

    setYOffset(172);
  }, []);

  useEffect(() => {
    if (questionPaper.showQuestionPaper) {
      closeAllExpandedQuestion();
    }
  }, [questionPaper]);

  async function updateDocument(): Promise<void> {
    let payload = {
      _id: params.documentId,
      documentName,
      documentDescription,
      questions,
      createdOn: getCurrentDateTime(),
      createdBy: "sudeep manasali",
      updatedOn: getCurrentDateTime(),
    }
    let res = await HttpRequestController(REQUEST_URLS.UPDATE_DOCUMENT, HTTP_METHODS.PUT, payload);
    toast.success("Questions saved successfully");
  }

  async function getAllQuestions(): Promise<void> {
    let { document } = await HttpRequestController(REQUEST_URLS.GET_DOCUMENT + `/${params.documentId}`, HTTP_METHODS.GET);
    setDocDesc(document.documentDescription);
    setDocName(document.documentName);
    let documentQuestions = document.questions.map((question: Question) => {
      return new Question(question);
    });
    setQuestions(documentQuestions);

    setQuestionPaper({
      ...questionPaper,
      documentName: document.documentName
    });
  }

  // Function to handle scroll event
  const handleScroll = (event: any) => {
    setTimeout(() => {
      let elementRect = document.getElementsByClassName('MuiAccordion-root')[currQueIdx + 1]?.getBoundingClientRect();
      let containerRect = document.getElementsByClassName('question-form')[0]?.getBoundingClientRect();
      const isVisible = elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom;
      if (isVisible) {
        updateToolBoxPosition(currQueIdx);
      } else {
        setYOffset(event.target.scrollTop > 170 ? event.target.scrollTop : 165);
      }
    }, 300);
  };

  // updates tool box position when new question box is added
  const updateToolBoxPosition = (questionIndex?: number, addQuestion = false): void => {
    setTimeout(() => {
      if (inputRefs.current.length > 0 && inputRefs.current[0]) {
        let inputBoxIndex = questionIndex !== undefined ? questionIndex : questions.length - 1;
        const accordionRect = inputRefs.current[inputBoxIndex]?.getBoundingClientRect();
        if (accordionRect) {
          const scrollTop = document.getElementsByClassName('question-form')[0].scrollTop;
          let targetTopRelativeToDiv = accordionRect.top - 160 + scrollTop;
          // when adding a new question the box will not
          // align properly so we need it
          if (addQuestion) {
            targetTopRelativeToDiv += 26;
          }
          setYOffset(targetTopRelativeToDiv > 0 ? targetTopRelativeToDiv : 0);
        }
      } else {
        setYOffset(0);
        setCurQueIdx(0);
      }
    }, 300);
  }

  // updates tool box position when user focus particular question box
  function handleFocus(event: any, questionIndex: number): void {
    setCurQueIdx(questionIndex);
    setTimeout(() => {
      const accordionRoot = event.target.closest('.MuiAccordion-root');
      if (accordionRoot) {
        const accordionRect = accordionRoot.getBoundingClientRect();
        if (inputRefs.current.length > 0) {
          let lastInput = inputRefs.current[questionIndex];
          lastInput.focus();
        }
        const scrollTop = document.getElementsByClassName('question-form')[0].scrollTop;
        let targetTopRelativeToDiv = accordionRect.top - 160 + scrollTop;
        setYOffset(targetTopRelativeToDiv > 0 ? targetTopRelativeToDiv : 172);
      }
    }, 300);
  }

  function onDragEnd(result: any) {
    if (!result.destination) {
      return;
    }
    var itemgg = [...questions];
    const itemF = reorder(
      itemgg,
      result.source.index,
      result.destination.index
    );
    setQuestions(itemF as Question[]);
    toast.success('Questions swapped', {
      position: "bottom-right"
    });
    updateToolBoxPosition(currQueIdx);
  }

  const reorder = (list: any, startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  function closeAllExpandedQuestion(): void {
    let expandedQuestion = questions.map((question: Question) => {
      return question.openAndCloseQuestion(false);
    });
    setQuestions(expandedQuestion);
  }

  function handleExpand(questionIndex: number): void {
    let expandedQuestion = questions.map((question: Question, j: number) => {
      return question.openAndCloseQuestion(questionIndex == j);
    });
    setQuestions(expandedQuestion);
  }

  function updateQuestion(question: string, questionIndex: number): void {
    let currentQuestions = [...questions];
    currentQuestions[questionIndex].updateQuestion(question);
    setQuestions(currentQuestions);
  }

  function addOption(questionIndex: number): void {
    let currentQuestions = [...questions];
    currentQuestions[questionIndex].addNewOption();
    setQuestions(currentQuestions);
  }

  function removeOption(questionIndex: number, optionIndex: number): void {
    let currentQuestions = [...questions];
    currentQuestions[questionIndex].removeOption(optionIndex);
    setQuestions(currentQuestions);
  }

  function addQuestionTemplate(): void {
    closeAllExpandedQuestion();
    let currentQuestions = [...questions];
    currentQuestions.splice(currQueIdx + 1, 0, new Question());
    setQuestions(currentQuestions);
    setCurQueIdx(currQueIdx => currQueIdx + 1);
    setTimeout(() => {
      updateToolBoxPosition(currQueIdx, true); // Call updateToolBoxPosition after a brief delay
    }, 0);
    toast.success('Question added', {
      position: "bottom-right"
    })
  }

  function updatedQuestionType(questionIndex: number, type: any): void {
    let currentQuestions = [...questions];
    currentQuestions[questionIndex].updateQuestionType(type);
    setQuestions(currentQuestions);
  }

  function deleteQuestion(questionIndex: number): void {
    closeAllExpandedQuestion();
    let currentQuestions = [...questions];
    currentQuestions.splice(questionIndex, 1);
    inputRefs.current.splice(questionIndex, 1);

    if (questionIndex >= 1) {
      currentQuestions[questionIndex - 1].openAndCloseQuestion(true);
      updateToolBoxPosition(questionIndex - 1);
      setCurQueIdx(currQueIdx => currQueIdx - 1);
    } else if (questionIndex == 0 && currentQuestions.length > 0) {
      currentQuestions[questionIndex].openAndCloseQuestion(true);
      updateToolBoxPosition(questionIndex);
      setCurQueIdx(currQueIdx => questionIndex == 0 ? questionIndex : currQueIdx - 1);
    } else {
      setCurQueIdx(0);
      updateToolBoxPosition(questionIndex);
    }
    setQuestions(() => [...currentQuestions]);
    toast.success('Question deleted', {
      position: "bottom-right"
    })
  }

  function handleOptionValue(value: string, i: number, j: number) {
    var currentQuestions = [...questions];
    currentQuestions[i].updateOption(j, value);
    setQuestions(currentQuestions);
  }

  function copyQuestion(questionIndex: number): void {
    closeAllExpandedQuestion();
    let currentQuestions = [...questions];
    let copiedQuestion = currentQuestions[questionIndex].copyQuestion();
    currentQuestions.splice(questionIndex + 1, 0, copiedQuestion);
    setQuestions(currentQuestions);
    updateToolBoxPosition(questionIndex + 1);
    toast.success('Question copied', {
      position: "bottom-right"
    })
  }

  function requiredQuestion(questionIndex: number) {
    let currentQuestions = [...questions];
    currentQuestions[questionIndex].updateRequiredType();
    setQuestions(currentQuestions);
  }


  function displayQuestions() {
    return questions.map((question: Question, i: any) => {
      return <Draggable key={question._id} draggableId={question._id} index={i}>
        {(provided) => (
          <div ref={provided.innerRef}  {...provided.draggableProps} {...provided.dragHandleProps}>
            <div>
              <div className={questionPaper.showQuestionPaper ? " question-container add-margin" : "question-container"}>
                {
                  !questionPaper.showQuestionPaper && (
                    <div className="drag-indicator-box">
                      <DragIndicatorIcon className="icon" fontSize="small" />
                    </div>
                  )
                }
                <Accordion onChange={(event) => {
                  if (!questionPaper.showQuestionPaper) {
                    handleExpand(i); handleFocus(event, i);
                  }
                }} expanded={questions[i].open} className={questions[i].open ? "add-border" : ""}>
                  <AccordionSummary aria-controls="panel1-content" id="panel1-header">
                    {(!questions[i].open) && (
                      <div className="saved-questions">
                        <Typography className="question-text">
                          {(i + 1).toString() + ". " + question.question}
                        </Typography>
                        {question.options.map((op, j) => (
                          <div key={j}>
                            <div className="option-box">
                              <FormControlLabel className="form-control-label" disabled={!questionPaper.showQuestionPaper}
                                control={
                                  <input type={question.questionType}
                                    value={question.options[j].option}
                                    className="option-input-box" disabled={!questionPaper.showQuestionPaper} />
                                }
                                label={
                                  <Typography className="option-text-value">
                                    {question.options[j].option}
                                  </Typography>
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionSummary>




                  <div className="question-box">
                    <AccordionDetails className="add-question">
                      <div>
                        <div className="add-question-top">
                          <textarea className="question"
                            ref={(e) => { inputRefs.current[i] = e }}
                            placeholder="Question" value={question.question} onChange={(e) => { updateQuestion(e.target.value, i) }} />

                          <Select className="select" value={question.questionType} onChange={(e) => { updatedQuestionType(i, e.target.value) }}>
                            <MenuItem id="checkbox" value={QUESTION_TYPES.CHECKBOX} >
                              <div className="menu-item"><CheckBoxIcon /> <span className="label">Checkboxes</span></div>
                            </MenuItem>

                            <MenuItem id="radio" value={QUESTION_TYPES.RADIO} >
                              <div className="menu-item"><RadioButtonCheckedIcon /> <span className="label">Multiple choices</span></div>
                            </MenuItem>
                          </Select>
                        </div>

                        {question?.options.length > 0 &&
                          question.options.map((op, j) => (
                            <div className="add-question-body" key={j}>
                              <div className="option-box">
                                {question.questionType != QUESTION_TYPES.TEXT ? (
                                  <input
                                    disabled
                                    className="question-text-input"
                                    type={question.questionType}
                                  />
                                ) : (
                                  <ShortTextIcon className="icon" />
                                )}

                                <input type="text" className="text-input" placeholder="option"
                                  onChange={(e) => {
                                    handleOptionValue(e.target.value, i, j);
                                  }}
                                />

                                <div className="close-box">
                                  <Tooltip title="Add Image" placement="bottom">
                                    <CropOriginalIcon className="icon" />
                                  </Tooltip>
                                  <Tooltip title="Remove">
                                    <IconButton aria-label="delete" onClick={() => { removeOption(i, j) }} >
                                      <CloseIcon />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          ))}

                        {question.options.length < 5 && (
                          <div className="add-question-body">
                            <div className="option-box">
                              <input disabled
                                className="question_text_input"
                                type={question.questionType}
                              />
                              <Button size="small" onClick={() => { addOption(i); }} className="add-option-btn">
                                Add Option
                              </Button>
                            </div>

                          </div>
                        )}

                        <div className="question-footer">

                          <div className="question-bottom">
                            <Tooltip title="Duplicate" placement="bottom">
                              <IconButton
                                onClick={() => { copyQuestion(i) }}>
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete" placement="bottom">
                              <IconButton
                                onClick={() => { deleteQuestion(i) }}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Tooltip>
                            <div>
                              <span className="required">
                                Required
                              </span>
                              <Switch
                                name="checkedA"
                                color="primary"
                                checked={question.required}
                                onClick={() => { requiredQuestion(i) }}
                              />
                            </div>

                            <IconButton>
                              <MoreVertIcon />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    </AccordionDetails>
                  </div>
                </Accordion>
              </div>
            </div>
          </div >
        )
        }
      </Draggable >
    })
  }

  return (
    <div>
      <div className={questionPaper.showQuestionPaper ? "question-paper-full-height question-form" : "question-form"} id="question-form" onScroll={handleScroll}>
        <div className="section">
          <div className="question-title-section">
            <div className="question-form-top">
              <input
                type="text"
                className="question-form-top-name MuiAccordion-root"
                placeholder="Untitled form"
                value={documentName}
                onChange={(e) => {
                  setDocName(e.target.value);
                  setQuestionPaper({
                    ...questionPaper,
                    documentName: e.target.value
                  });
                }}
                readOnly={questionPaper.showQuestionPaper}
              />
              <input
                type="text"
                className="question-form-top-desc"
                placeholder="Document description"
                value={documentDescription}
                onChange={(e) => {
                  setDocDesc(e.target.value);
                }}
                readOnly={questionPaper.showQuestionPaper}
              />
            </div>
          </div>


          {
            questions && (<DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {displayQuestions()}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            )
          }

          {
            !!questions.length && <div className="save-form">
              <Button
                variant="contained"
                color="primary"
                onClick={updateDocument} >
                {questionPaper.showQuestionPaper ? "Submit" : "Save"}
              </Button>
            </div>
          }
        </div>

        {
          !questionPaper.showQuestionPaper && (<div className="question-edit" style={{ top: `${yoffset}px` }} ref={divRef}>
            <Tooltip title="Add question" placement="right">
              <AddCircleOutlineIcon className="edit" onClick={() => addQuestionTemplate()} />
            </Tooltip>
            <OndemandVideoIcon className="edit" />
            <CropOriginalIcon className="edit" />
            <TextFieldsIcon className="edit" />
          </div>)
        }
      </div>
      {questionPaper.showQuestionPaper && (
        <Tooltip title="Edit">
          <CreateIcon className="edit-question-paper-icon" onClick={() => (setQuestionPaper({
            ...questionPaper,
            showQuestionPaper: !questionPaper.showQuestionPaper
          }))} />
        </Tooltip>)
      }
    </div >
  )
}
