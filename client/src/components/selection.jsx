import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserCog, FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";

const departments = ["CS", "Physics", "Chemistry"];

export default function Selection() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/institute`, {
          withCredentials: true,
        });
        setInstitutes(response.data.institute);
      } catch (err) {
        console.error("Failed to fetch institutes", err);
      }
    };

    if (selectedRole === "student" || selectedRole === "faculty") {
      fetchInstitutes();
    }
  }, [selectedRole]);

  const handleSubmit = async () => {
    try {
      if (selectedRole === "faculty") {
        if (!institution || !department) {
          alert("Please select both institution and department");
          return;
        }

        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/update-faculty-details`,
          {
            institute: institution,
            department,
            role: selectedRole,
          },
          { withCredentials: true }
        );
      } else if (selectedRole === "student") {
        if (!institution) {
          alert("Please select an institution");
          return;
        }

        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/update-institution`,
          {
            institute: institution,
            role: selectedRole,
          },
          { withCredentials: true }
        );
      } else if (selectedRole === "admin") {
        await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/update-institution`,
          { role: selectedRole },
          { withCredentials: true }
        );
      }

      navigate("/profile")
    } catch (error) {
      console.error(error);
      alert("Submission failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-xl p-10 shadow-md ">
        <h2 className="text-2xl font-bold text-cyan-600 mb-6">Are you a...?</h2>
        <div className="flex gap-10 justify-center mb-6">
          <div
            onClick={() => setSelectedRole("student")}
            className={`cursor-pointer p-4 rounded-lg shadow-md hover:shadow-lg transition-all border ${
              selectedRole === "student" ? "border-cyan-500" : "border-transparent"
            }`}
          >
            <FaUserGraduate className="text-3xl mx-auto mb-2" />
            <p className="text-center">Student</p>
          </div>

          <div
            onClick={() => setSelectedRole("faculty")}
            className={`cursor-pointer p-4 rounded-lg shadow-md hover:shadow-lg transition-all border ${
              selectedRole === "faculty" ? "border-cyan-500" : "border-transparent"
            }`}
          >
            <FaChalkboardTeacher className="text-3xl mx-auto mb-2" />
            <p className="text-center">Faculty</p>
          </div>

          <div
            onClick={() => setSelectedRole("admin")}
            className={`cursor-pointer p-4 rounded-lg shadow-md hover:shadow-lg transition-all border ${
              selectedRole === "admin" ? "border-cyan-500" : "border-transparent"
            }`}
          >
            <FaUserCog className="text-3xl mx-auto mb-2" />
            <p className="text-center">Admin</p>
          </div>
        </div>

        {selectedRole && (
          <div className="flex flex-col space-y-4">
            {(selectedRole === "student" || selectedRole === "faculty") && (
              <select
                className="border p-2 rounded w-80"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              >
                <option value="">Select Institution</option>
                {institutes.map((inst, idx) => (
                  <option key={idx} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            )}

            {selectedRole === "faculty" && (
              <select
                className="border p-2 rounded w-80"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleSubmit}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded w-full"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
