import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React from "react";
import { db } from "../../firebase/config";

const useFireStore = (collections, type) => {
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    const q = query(collection(db, collections), orderBy("createAt"));
    const getDataMethod = onSnapshot(q, (querySnapshot) => {
      const documents = [];
      if (type === "all") {
        querySnapshot.forEach((doc) => {
          documents.push({ ...doc.data(), id: doc.id });
        });
      }
      if (type === "changes") {
        querySnapshot.docChanges().forEach((changes) => {
          if (changes.type === "added") {
            documents.push({ ...changes.doc.data(), id: changes.doc.id });
          }
        });
      }
      console.log(documents)
      setData(documents);
    });

    return () => {
      getDataMethod();
    };
  }, [collections]);

  return data;
};

export default useFireStore;
