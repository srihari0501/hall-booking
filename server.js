const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let rooms = [];
let bookings = [];
let customers = [];

/**
 * Endpoint to create a room
 * Request Body: { seats: number, amenities: string[], pricePerHour: number }
 * Response: Created room object
 */
app.post('/rooms', (req, res) => {
  const { seats, amenities, pricePerHour } = req.body;
  const newRoom = { id: rooms.length + 1, seats, amenities, pricePerHour };
  rooms.push(newRoom);
  res.status(201).json(newRoom);
});

/**
 * Endpoint to get all rooms with booking data
 * Response: Array of room objects with booking data
 */
app.get('/rooms', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const roomData = rooms.map(room => {
    const roomBookings = bookings.filter(booking => booking.roomId === room.id);
    const bookedStatus = roomBookings.some(booking => booking.date === today);
    return {
      ...room,
      bookedStatus,
      bookings: roomBookings.map(booking => ({
        customerName: booking.customerName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      }))
    };
  });
  res.json(roomData);
});

/**
 * Endpoint to book a room
 * Request Body: { customerName: string, date: string, startTime: string, endTime: string, roomId: number }
 * Response: Created booking object or error message if the room is already booked
 */
app.post('/bookings', (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;

  // Check if the room is already booked at the given time
  const isBooked = bookings.some(booking => 
    booking.roomId === roomId && 
    booking.date === date && 
    ((startTime >= booking.startTime && startTime < booking.endTime) || 
    (endTime > booking.startTime && endTime <= booking.endTime) || 
    (startTime <= booking.startTime && endTime >= booking.endTime))
  );

  if (isBooked) {
    return res.status(400).json({ message: "Room is already booked at this time." });
  }

  const newBooking = { 
    id: bookings.length + 1, 
    customerName, 
    date, 
    startTime, 
    endTime, 
    roomId,
    bookingDate: new Date().toISOString()
  };
  bookings.push(newBooking);

  // Track customers
  const customerExists = customers.find(customer => customer.name === customerName);
  if (!customerExists) {
    customers.push({ name: customerName });
  }

  res.status(201).json(newBooking);
});

/**
 * Endpoint to list all customers with their booking data
 * Response: Array of customer objects with booking data
 */
app.get('/customers', (req, res) => {
  const customerData = customers.map(customer => {
    const customerBookings = bookings.filter(booking => booking.customerName === customer.name);
    return {
      customerName: customer.name,
      bookings: customerBookings.map(booking => {
        const room = rooms.find(room => room.id === booking.roomId);
        return {
          roomId: room.id,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
        };
      })
    };
  });
  res.json(customerData);
});

/**
 * Endpoint to list all bookings by a specific customer
 * Path Parameter: customerName
 * Response: Array of booking objects for the specified customer
 */
app.get('/customers/:customerName/bookings', (req, res) => {
  const { customerName } = req.params;
  const customerBookings = bookings.filter(booking => booking.customerName === customerName);

  if (customerBookings.length === 0) {
    return res.status(404).json({ message: "No bookings found for this customer." });
  }

  const bookingsData = customerBookings.map(booking => {
    const room = rooms.find(room => room.id === booking.roomId);
    return {
      customerName: booking.customerName,
      roomId: room.id,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      bookingId: booking.id,
      bookingDate: booking.bookingDate,
      bookingStatus: "Confirmed"
    };
  });

  res.json(bookingsData);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
