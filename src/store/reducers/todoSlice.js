import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import axios from "axios";
import HttpService from "../../utils/https";

export const getTodos = createAsyncThunk("todos/todosFetched", async () => {
  const response = await HttpService.get("todos", { _limit: 10 });
  return response.data;
});

export const addTodo = createAsyncThunk("todos/addTodo", async (title) => {
  const newTodo = {
    id: nanoid(),
    title,
    completed: false,
  };
  await axios.post("https://jsonplaceholder.typicode.com/todos", newTodo);
  return newTodo;
});

export const deleteTodo = createAsyncThunk(
  "todos/deleteTodos",
  async (todoId) => {
    await axios.delete(`https://jsonplaceholder.typicode.com/todos/${todoId}`);
    return todoId;
  }
);

const todoSlice = createSlice({
  name: "todos",
  initialState: {
    allTodos: [],
  },
  reducers: {
    markCompleted: {
      prepare(todoId) {
        return {
          payload: todoId,
        };
      },
      reducer(state, action) {
        state.allTodos = state.allTodos.map((todo) => {
          if (todo.id === action.payload) {
            todo.completed = !todo.completed;
          }
          return todo;
        });
      },
    },
  },
});

const todoReducer = todoSlice.reducer;
export const { markCompleted } = todoSlice.actions;
export default todoReducer;
