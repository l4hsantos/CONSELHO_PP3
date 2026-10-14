import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import ProfessorHomeScreen from '../screens/professor/ProfessorHomeScreen';

const Tab = createBottomTabNavigator();

export default function ProfessorTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="ProfessorHome" component={ProfessorHomeScreen} options={{tabBarLabel: 'Início',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}