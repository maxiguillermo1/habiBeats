// PromptSelector.tsx
// Mariann Grace Dizon

// START of Prompt Selector Component
// START of Mariann Grace Dizon Contribution
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';

// Define the props interface for the PromptSelector component
interface PromptSelectorProps {
  value: string;
  onSelect: (question: string) => void;
  onRemove: () => void;
  options: string[];
}

// PromptSelector component allows users to select a prompt from a list of options
export const PromptSelector: React.FC<PromptSelectorProps> = ({ value, onSelect, onRemove, options }) => {
  // State to control the visibility of the modal
  const [modalVisible, setModalVisible] = useState(false);

  // Function to handle the selection of an option
  const handleSelect = (option: string) => {
    onSelect(option);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Button to open the prompt selection modal */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>{value || "Select a prompt"}</Text>
      </TouchableOpacity>
      
      {/* Button to remove the selected prompt */}
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>

      {/* Modal for displaying the list of prompt options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          {/* FlatList to render the list of prompt options */}
          <FlatList
            data={options}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          
          {/* Button to close the modal */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// Styles for the PromptSelector component
const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  selectButtonText: {
    color: '#000',
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    marginTop: 40,
  },
  optionItem: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#fc6c85',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
    marginBottom: 40,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// END of Prompt Selector Component
// END of Mariann Grace Dizon Contribution
