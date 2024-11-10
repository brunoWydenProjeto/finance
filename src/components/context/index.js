import { createContext, useEffect, useState } from "react";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { app } from "../services/firebaseConfig";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  collection,
  deleteDoc,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";

const provider = new GoogleAuthProvider();
export const MyContext = createContext({});

export const MyContextProvider = ({ children }) => {
  const auth = getAuth(app);
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseName, setExpenseName] = useState("");
  const [cost, setCost] = useState();
  const [expiration, setExpiration] = useState("");
  const [editId, setEditId] = useState("");
  let userOn = null;

  useEffect(() => {
    const loadStorage = () => {
      const sessionToken = sessionStorage.getItem("@AuthFirebase:token");
      const sessionUser = sessionStorage.getItem("@AuthFirebase:user");
      if (sessionToken && sessionUser) {
        setUser(sessionUser);
      }
    };
    loadStorage();
  }, []);

  const signIn = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        setUser(user);
        sessionStorage.setItem("@AuthFirebase:token", token);
        sessionStorage.setItem("@AuthFirebase:user", JSON.stringify(user));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  function signOut() {
    sessionStorage.clear();
    setExpenses([]);
    setUser(null);

    return <Navigate to="/" />;
  }

  try {
    userOn = JSON.parse(user);
  } catch (e) {
    console.log(e);
  }

  const getExpenses = async () => {
    try {
      const data = await getDocs(collection(db, userOn.uid));
      setExpenses(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.log(error);
    }
  };

  const deleteExpense = (id) => {
    const expenseDoc = doc(db, userOn.uid, id);
    deleteDoc(expenseDoc);
    console.log("Document deleted with ID: ", id);
    getExpenses();
  };

  const deleteAll = () => {
    // eslint-disable-next-line array-callback-return
    expenses.map((d) => {
      const expenseDoc = doc(db, userOn.uid, d.id);
      deleteDoc(expenseDoc);
      console.log("Document deleted with ID: ", d.id);
    });
    getExpenses();
  };

  const editHandler = async (id) => {
    try {
      const expenseDoc = doc(db, userOn.uid, id);
      const docSnap = await getDoc(expenseDoc);
      setExpenseName(docSnap.data().Despesa);
      setCost(docSnap.data().Valor);
      setExpiration(docSnap.data().Vencimento);
    } catch (err) {
      console.log(err);
    }
  };

  const alterCheck = async (id) => {
    const expenseDoc = doc(db, userOn.uid, id);
    const docSnap = await getDoc(expenseDoc);
   if( docSnap.data().Checked === true){
    try {
      await updateDoc(doc(db, userOn.uid, id), {
        Checked: false,
      });
      console.log("Document updated with ID: ", id);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
   } else {
    try {
      await updateDoc(doc(db, userOn.uid, id), {
        Checked: true,
      });
      console.log("Document updated with ID: ", id);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
   }
   getExpenses();
  }

  async function addEditExpense() {
    if (editId !== undefined && editId !== "") {
      try {
        await updateDoc(doc(db, userOn.uid, editId), {
          Despesa: expenseName,
          Vencimento: expiration,
          Valor: parseFloat(cost),
        });
        console.log("Document updated with ID: ", editId);
      } catch (e) {
        console.error("Error updating document: ", e);
      }
    } else {
      try {
        const docRef = await addDoc(collection(db, userOn.uid), {
          Despesa: expenseName,
          Vencimento: expiration,
          Valor: parseFloat(cost),
          Checked: false,
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    getExpenses();
    setEditId("");
    setExpenseName("");
    setCost("");
    setExpiration("");
  }

  const sweetConfirmForOne = (id) => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Você não conseguirá reverter isso!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, deletar!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteExpense(id);
        Swal.fire("Deletado!", "Sua despesa foi removida com sucesso.", "success");
      }
    });
  };

  const sweetConfirmForAll = () => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Você irá apagar toda a lista de despesas!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, deletar!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteAll();
        Swal.fire("Limpo!", "Toda a sua lista foi apagada.", "success");
      }
    });
  };

  return (
    <MyContext.Provider
      value={{
        signIn,
        signed: !!user,
        user,
        signOut,
        getExpenses,
        expenses,
        editHandler,
        setExpiration,
        expiration,
        setCost,
        cost,
        setExpenseName,
        expenseName,
        addEditExpense,
        editId,
        setEditId,
        sweetConfirmForOne,
        sweetConfirmForAll,
        alterCheck,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};
