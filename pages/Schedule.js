import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const BASE_URL = 'http://10.0.2.2:8080';
const socket = io(BASE_URL);

const Schedule = () => {
    const [bookings, setBookings] = useState({});
    const [userBookings, setUserBookings] = useState({});
    const [loading, setLoading] = useState(true);
    const [closedDays, setClosedDays] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    

    useEffect(() => {
        fetchClosedDays();
        fetchBookings();
        const fetchCurrentUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData !== null) {
                    setCurrentUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchCurrentUser();

        socket.on('bookingUpdate', fetchBookings);

        return () => {
            socket.off('bookingUpdate', fetchBookings);
        };
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/bookings/four-weeks`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
                preprocessBookings();
                setLoading(false);
            } else {
                throw new Error('Error fetching bookings');
            }
        } catch (error) {
            alert('Fetch Error:', error);
        }
    };

    const preprocessBookings = () => {
        const updatedUserBookings = {};
        Object.keys(bookings).forEach(date => {
            const morningBooking = bookings[date].morning.bookings.find(booking => booking.name === currentUser.name);
            const afternoonBooking = bookings[date].afternoon.bookings.find(booking => booking.name === currentUser.name);
    
            updatedUserBookings[date] = {
                morning: morningBooking,
                afternoon: afternoonBooking,
            };
        });
        setUserBookings(updatedUserBookings);
    };
    

    const processBookings = date => {
        const combinedBookings = [];

        bookings[date].morning.bookings.forEach(booking => {
            combinedBookings.push({
                name: booking.name,
                icon: '☀️',
                id: booking.id,
            });
        });

        bookings[date].afternoon.bookings.forEach(booking => {
            let existingBooking = combinedBookings.find(b => b.name === booking.name);
            if (existingBooking) {
                existingBooking.icon += '🌚';
            } else {
                combinedBookings.push({
                    name: booking.name,
                    icon: '🌚',
                    id: booking.id,
                });
            }
        });

        return combinedBookings.map((booking, index) => ({
            ...booking,
            key: booking.id + "_" + index 
        }));
    };

    const fetchClosedDays = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/closed-days`);
            if (!response.ok) {
                throw new Error('Error fetching closed days');
            }
            const data = await response.json();
            const formattedClosedDays = data.map(period => ({
                start: new Date(period.start_date),
                end: new Date(period.end_date),
                reason: period.reason,
            }));
            setClosedDays(formattedClosedDays);
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    };

    const isClosedDay = dateString => {
        const givenDate = new Date(dateString.split('-').reverse().join('-'));
        return closedDays.some(period => 
            givenDate >= period.start && givenDate <= period.end
        );
    };

    const bookShift = async (date, type) => {
        try {
          const response = await fetch(`${BASE_URL}/api/bookings/book-shift`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shift_date: date, shift_type: type }),
          });
          const data = await response.json();
          if (response.ok) {
            fetchBookings();
          } else {
            alert('Booking failed:', data);
          }
        } catch (error) {
          alert('Booking Error:', error);
        }
      };

    const cancelShift = async bookingId => {
        try {
            const response = await fetch(`${BASE_URL}/api/bookings/cancel-shift`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId }),
            });
            if (response.ok) {
                fetchBookings();
            }
        } catch (error) {
            console.error('Cancellation Error:', error);
        }
    };

    const getWeekNumber = dateString => {
        const date = new Date(dateString.split('-').reverse().join('-'));
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((days / 7)+1);
    };

    const formatDate = dateString => {
        const date = new Date(dateString.split('-').reverse().join('-'));
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const isDisabled = dateString => {
        const givenDate = new Date(dateString.split('-').reverse().join('-'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return givenDate < today;
    }

    if (loading) {
        return (
            <View style={styles.spinnerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {Object.keys(bookings).map(date => {
                const isMonday = new Date(date.split('-').reverse().join('-')).getDay() === 1;
                const dayIsClosed = isClosedDay(date);

                const userBookedMorning = bookings[date].morning.bookings.some(booking => booking.name === currentUser.name);
                const userBookedAfternoon = bookings[date].afternoon.bookings.some(booking => booking.name === currentUser.name);

                return (
                    <View key={date} style={[styles.dateContainer, dayIsClosed ? styles.closedDayStyle : null]}>
                        {isMonday && <Text style={styles.weekNumber}>Week {getWeekNumber(date)}</Text>}
                        <View style={styles.dateRow}>
                            <Text style={styles.date}>{formatDate(date)}</Text>
                            {dayIsClosed && <Text style={styles.closedDay}>Office Closed</Text>}
                        </View>
                        <View style={styles.shiftContainer}>
                            {!dayIsClosed && (
                                <Text style={styles.shiftText}>
                                ☀️ - {bookings[date].morning.spotsLeft} spots left                     🌚 - {bookings[date].afternoon.spotsLeft} spots left
                                </Text>
                            )}
                            
                        </View>
                        {!dayIsClosed && (
                            <View style={styles.bookingActions}>
                                {!userBookedMorning ? (
                                    <Button
                                        title="Book Morning"
                                        onPress={() => bookShift(date, 'morning')}
                                        disabled={isDisabled(date) || bookings[date].morning.spotsLeft === 0}
                                        color={bookings[date].morning.spotsLeft === 0 ? '#ccc' : '#535bf2'}
                                    />
                                ) : (
                                    <Button title="Cancel Morning" disabled={isDisabled(date)} onPress={() => cancelShift(userBookings[date]?.morning?.bookingId)} color="#ff6b6b" />
                                )}

                                {!userBookedAfternoon ? (
                                    <Button
                                        title="Book Afternoon"
                                        onPress={() => bookShift(date, 'afternoon')}
                                        disabled={isDisabled(date) || bookings[date].afternoon.spotsLeft === 0}
                                        color={bookings[date].afternoon.spotsLeft === 0 ? '#ccc' : '#535bf2'}
                                    />
                                ) : (
                                    <Button title="Cancel Afternoon" disabled={isDisabled(date)} onPress={() => cancelShift(userBookings[date]?.afternoon?.bookingId)} color="#ff6b6b" />
                                )}
                            </View>
                        )}
                        <View style={styles.bookingsList}>
                            {processBookings(date).map(booking => (
                                <Text key={booking.key} style={styles.bookingEntry}>
                                    {booking.name} - {booking.icon}
                                </Text>
                            ))}
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,

    },
    weekNumber: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 4,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    },
    date: {
        fontWeight: 'bold',
    },
    bookingsList: {
        marginTop: 10,
        marginBottom: 30,
    },
    bookingActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
    },
    closedDayStyle: {
        backgroundColor: '#ccc',
    },
});

export default Schedule;
