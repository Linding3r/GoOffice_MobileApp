import { Text, View , StyleSheet} from 'react-native';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const Home = () => {
    const [newsItems, setNewsItems] = useState([]);
    const BASE_URL = 'http://10.0.2.2:8080';
    const socket = io(BASE_URL);

    const fetchInitialNews = async () => {
        try {
            const response = await fetch(BASE_URL + '/api/news/get-all');
            console.log(response);
            if (response.ok) {
                const data = await response.json();
                if (data.news) {
                    setNewsItems(data.news);
                }
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Server responded with an error');
            }
        } catch (error) {
            alert('An error occurred while fetching news: ' + error.message);
        }
    };

    const processNews = newsItems => {
        return newsItems.map((news, index) => ({
            ...news,
            key: news.id + '_' + index,
        }));
    };

    useEffect(() => {
        fetchInitialNews();
        socket.on('newsUpdate', fetchInitialNews);

        return () => {
            socket.off('newsUpdate', fetchInitialNews);
        };
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Company News</Text>
            {processNews(newsItems).map(news => (
                <View style={styles.newsContainer} key={news.key}>
                    <View>
                        <Text style={styles.title}>{news.title}</Text>
                    </View>
                    <View>
                        <Text style={styles.description}>{news.description}</Text>
                    </View>
                    <View>
                        {!news.edited ? (
                        <Text style={styles.date}>{new Date(news.time).toLocaleString()}</Text>
                        ):(
                            <Text style={styles.date}>edited: {new Date(news.edited).toLocaleString()}</Text>
                        )}
                    
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
      },
      newsContainer: {
        width: '90%',
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.25,
        shadowRadius: 28,
        elevation: 20,
        marginTop: 20,
      },
    news: {
        alignContent: 'center',
    },
    title: {
        fontSize: 20,
        alignSelf: 'center',
    },
    date: {
        color: 'grey',
        marginHorizontal: 10,
        fontSize: 11,
        marginTop: 10
    },
    description: {
        marginTop: 15,
        marginHorizontal: 10,
    },
    header: {
        fontSize: 40,
        alignSelf: 'center',
        fontWeight: 'bold',
        marginTop: 30,
    },
  
  });

export default Home;
