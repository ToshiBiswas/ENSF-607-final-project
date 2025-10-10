import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       {/* <h1 className="text-3xl font-bold underline">
        Hello world!
      </h1> */}
      <div class="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
        <h2 class="text-2xl font-bold text-center text-gray-800 mb-6"> MindPlanner</h2>

        <form action="/register" method='POST' class="space-y-4">

        {/* <!--  Full name --> */}

        <div>
          <label for="fullname" class="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input type="text" id="fullname" name="fullname" placeholder="Enter your name"
          class="w-full px-4 py-2 border boder-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required></input>
        </div>
        

        {/* Email */}
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" id="email" name="email" placeholder="example@gmail.com" 
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus" required></input>
        </div>
        
        {/* Password */}
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1"> Password</label>
          <input type="password" id="confirm" name="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg
          focus:ring-blue-500 focus:outline-none" placeholder="Enter Password" minlength="6" required></input>
        </div>

        {/* Confirm Password */}
        <div>
          <label for="confirm">Confirm Password</label> 
          <input type="password" id="confirm" name="confirm" placeholder="Re-enter password" class="w-full px-4 py-2 border boder-gray-300 rounded-lg
          focus:ring-2 focus:ring-2-blue-500 focus:outline-none" minlength="6" required></input>  
        </div>
        
        {/* Gender selection */}
        <label for="gender" class="block text-sm font-medium text-gray-700 mb-1"> Gender</label>
        <select id="gender" name="gender" class="w-full px-4 py-2 border border-gray-300 rounded-lg
        focus:ring-blue-500 focus:outline-none" required>
          <option value="" disabled selected> Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="Other">Other</option>
        </select>
        
        {/* Date of Birth */}
        <div>
          <label for="dob" class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input type="date" id="dob" name="dob" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
          focus:ring-blue-500 focus:outline-none" required></input>
        </div>

        {/* Agreement Term */}
        <div class="flex items-center">
          <input type="checkbox" name="terms"
          class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" required></input>
            <label for="terms" class="ml-2 text-sm text-gray-700">            
            I agree to the <a href='#' class="text-blue-600 hover:underline">Terms & Conditions</a>
          </label>
        </div>


        
        {/* Submit button */}
        <div class="flex items-center">
          <button type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Register
          </button>
          <button class="w-full bg-lime-600 text-black py-2 rounded-lg">Register</button>

        </div>
        
        </form>

        <div>
          Already have an account? <a href="/login" class="text-blue-600 hover:underline"> Login here</a>
        </div>
        
      </div>
    </>
  )
}

export default App
