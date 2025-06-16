import React, { useReducer, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import "./Student.css";

// Initial state
const initialState = {
  name: '',
  age: '',
  marks: ['', '', '', '', ''],
  students: [],
  editIndex: null,
  searchTerm: '',
  sortKey: 'name',
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_MARK':
      const newMarks = [...state.marks];
      newMarks[action.index] = action.value;
      return { ...state, marks: newMarks };

    case 'SET_STUDENTS':
      return { ...state, students: action.payload };

    case 'ADD_STUDENT':
      return {
        ...state,
        students: [...state.students, action.payload],
        name: '', age: '', marks: ['', '', '', '', ''], editIndex: null
      };

    case 'UPDATE_STUDENT':
      const updated = [...state.students];
      updated[state.editIndex] = action.payload;
      return {
        ...state,
        students: updated,
        name: '', age: '', marks: ['', '', '', '', ''], editIndex: null
      };

    case 'DELETE_STUDENT':
      return {
        ...state,
        students: state.students.filter((_, i) => i !== action.index)
      };

    case 'EDIT_STUDENT':
      const student = state.students[action.index];
      return {
        ...state,
        name: student.name,
        age: student.age,
        marks: student.marks.map(String),
        editIndex: action.index
      };

    default:
      return state;
  }
};

const Student = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem("students");
    if (saved) {
      dispatch({ type: 'SET_STUDENTS', payload: JSON.parse(saved) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(state.students));
  }, [state.students]);

  const calculatePercentage = (marks) => {
    const total = 500;
    const obtained = marks.reduce((sum, m) => sum + m, 0);
    return ((obtained / total) * 100).toFixed(2);
  };

  const getDivision = (percent) => {
    if (percent >= 60) return "First Division";
    else if (percent >= 50) return "Second Division";
    else if (percent >= 35) return "Pass";
    else return "Fail";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, age, marks, editIndex } = state;
    const nameRegex = /^[A-Za-z ]+$/;

    if (!name || !age || marks.some(m => m === '')) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!nameRegex.test(name.trim())) {
      toast.error("Name should contain only letters and spaces.");
      return;
    }

    const markNums = marks.map(Number);

    if (markNums.some(m => isNaN(m) || m < 0 || m > 100)) {
      toast.error("Marks should be numbers between 0 and 100.");
      return;
    }

    if (isNaN(age) || Number(age) <= 0 || Number(age) > 100) {
      toast.error("Enter a valid age between 1 and 100.");
      return;
    }

    const percentage = calculatePercentage(markNums);
    const division = getDivision(percentage);

    const studentData = {
      name: name.trim(),
      age,
      marks: markNums,
      percentage,
      division
    };

    if (editIndex !== null) {
      dispatch({ type: 'UPDATE_STUDENT', payload: studentData });
      toast.success("Student updated!");
    } else {
      dispatch({ type: 'ADD_STUDENT', payload: studentData });
      toast.success("Student added!");
    }
  };

  const divisionOrder = {
    "First Division": 1,
    "Second Division": 2,
    "Pass": 3,
    "Fail": 4
  };

  const filteredSortedData = state.students
    .map((student, originalIndex) => ({ ...student, originalIndex })) // Attach original index
    .filter((student) =>
      student.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortKey === 'name') {
        return a.name.localeCompare(b.name);
      } else if (state.sortKey === 'division') {
        return divisionOrder[a.division] - divisionOrder[b.division];
      } else {
        return b.percentage - a.percentage;
      }
    });

  return (
    <div className="container mt-5">
      <Toaster position="top-right" />

      <div className="row g-4">
        {/* Form Section */}
        <div className="col-md-5">
          <div className="student-form">
            <form onSubmit={handleSubmit}>
              <h4 className="mb-4 text-center">Add / Edit Student</h4>

              <input type="text" className="form-control mb-3" placeholder="Student Name"
                value={state.name}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
              />

              <input type="number" className="form-control mb-3" placeholder="Student Age"
                value={state.age}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'age', value: e.target.value })}
              />

              {state.marks.map((mark, i) => (
                <input key={i} type="number" className="form-control mb-2" placeholder={`Marks ${i + 1}`}
                  value={mark}
                  onChange={(e) => dispatch({ type: 'SET_MARK', index: i, value: e.target.value })}
                />
              ))}

              <div className="d-grid">
                <button type="submit" className="btn btn-success">
                  {state.editIndex !== null ? "Update Student" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table Section */}
        <div className="col-md-7">
          <div className="student-table">
            <h4 className="mb-3 text-center">Student Records</h4>

            <input
              type="text"
              placeholder="Search by name"
              className="form-control mb-2"
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'searchTerm', value: e.target.value })}
            />

            <select
              className="form-select mb-3"
              value={state.sortKey}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'sortKey', value: e.target.value })}
            >
              <option value="name">Sort by Name</option>
              <option value="division">Sort by Division</option>
              <option value="percentage">Sort by Percentage</option>
            </select>

            {filteredSortedData.length === 0 ? (
              <p className="text-muted text-center">No student data found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Division</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSortedData.map((student, index) => (
                      <tr key={index}>
                        <td>{student.name}</td>
                        <td>{student.age}</td>
                        <td>{student.marks.join(', ')}</td>
                        <td>{student.percentage}%</td>
                        <td>{student.division}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() =>
                              dispatch({ type: 'EDIT_STUDENT', index: student.originalIndex })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              dispatch({ type: 'DELETE_STUDENT', index: student.originalIndex });
                              toast.error("Student deleted!");
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student;
