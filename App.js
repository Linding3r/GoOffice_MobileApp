import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { FAB, Portal, Provider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Login from './pages/Login';

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [open, setOpen] = useState(false);
    const Stack = createStackNavigator();
    const navigationRef = useNavigationContainerRef();
    const BASE_URL = 'http://10.0.2.2:8080';

    const onStateChange = ({ open }) => setOpen(open);

    const checkAuthStatus = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            setIsAuthenticated(userData !== null);
        } catch (error) {
            console.error('Error retrieving user data:', error);
        }
        setIsLoading(false);
    };

    const logout = async () => {
        try {
            const response = await fetch(BASE_URL + '/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.status === 200) {
                await AsyncStorage.removeItem('userData');
                setIsAuthenticated(false);
            } else {
                alert(data.message || 'Logout failed');
            }
        } catch (error) {
            console.log(error);
            alert('An error occurred while logging out.');
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                setIsAuthenticated(userData !== null);
            } catch (error) {
                console.error('Error retrieving user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    useEffect(() => {
        if (!isAuthenticated && navigationRef.isReady()) {
            navigationRef.navigate('Login');
        }
    }, [isAuthenticated, navigationRef]);

    if (isLoading) {
        return (
            <View style={styles.centeredView}>
            <ActivityIndicator size="large" color="#1b1c23" />
          </View>
        );
    }

    const headerStyle = {
        headerStyle: {
            backgroundColor: '#1b1c23',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontWeight: 'bold',
            alignSelf: 'center',
        },
    };

    return (
        <Provider>
            <NavigationContainer ref={navigationRef}>
                {isAuthenticated ? (
                    <Stack.Navigator>
                        <Stack.Screen name="Home" component={Home} options={headerStyle} />
                        <Stack.Screen name="Schedule" component={Schedule} options={headerStyle} />
                    </Stack.Navigator>
                ) : (
                    <Stack.Navigator>
                        <Stack.Screen name="Login">
                            {props => <Login {...props} onAuthChange={checkAuthStatus} options={headerStyle} />}
                        </Stack.Screen>
                    </Stack.Navigator>
                )}
            </NavigationContainer>
            {isAuthenticated && (
                <Portal>
                    <FAB.Group
                        style={styles.fabGroup}
                        fabStyle={styles.fab}
                        open={open}
                        icon={open ? 'close' : 'plus'}
                        color="white"
                        actions={[
                            {
                                icon: 'home',
                                label: 'Home',
                                color: 'white',
                                style: styles.actionButton,
                                onPress: () => navigationRef.navigate('Home'),
                            },
                            {
                                icon: 'calendar',
                                label: 'Schedule',
                                color: 'white',
                                style: styles.actionButton,
                                onPress: () => navigationRef.navigate('Schedule'),
                            },
                            { icon: 'logout', label: 'Logout', color: 'white', style: styles.actionButton, onPress: logout },
                        ]}
                        onStateChange={onStateChange}
                    />
                </Portal>
            )}
        </Provider>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      fabGroup: {
        
      },
      fab: {
        backgroundColor: '#1b1c23',
        
      },
      actionButton: {
        backgroundColor: '#1b1c23',
        
      },
});

export default App;
