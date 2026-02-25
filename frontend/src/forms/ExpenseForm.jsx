import React from 'react';
import { Form, Input, Select } from 'antd'; 
import useLanguage from '@/locale/useLanguage';

// Formulaire pour ajouter une nouvelle catégorie de dépenses
export default function CategoryForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  // Liste des couleurs à afficher dans la liste déroulante
  const colorOptions = [
    { value: 'default', label: 'default' },
    { value: 'magenta', label: 'magenta', color: 'magenta' },
    { value: 'red', label: 'red', color: 'red' },
    { value: 'volcano', label: 'volcano', color: 'volcano' },
    { value: 'orange', label: 'orange', color: 'orange' },
    { value: 'gold', label: 'gold', color: 'gold' },
    { value: 'lime', label: 'lime', color: 'lime' },
    { value: 'green', label: 'green', color: 'green' },
    { value: 'cyan', label: 'cyan', color: 'cyan' },
    { value: 'blue', label: 'blue', color: 'blue' },
    { value: 'geekblue', label: 'geekblue', color: 'geekblue' },
    { value: 'purple', label: 'purple', color: 'purple' },
    { value: 'indianred', label: 'IndianRed', color: '#CD5C5C' },
    { value: 'lightcoral', label: 'LightCoral', color: '#F08080' },
    { value: 'salmon', label: 'Salmon', color: '#FA8072' },
    { value: 'darksalmon', label: 'DarkSalmon', color: '#E9967A' },
    { value: 'lightsalmon', label: 'LightSalmon', color: '#FFA07A' },
    { value: 'crimson', label: 'Crimson', color: '#DC143C' },
    { value: 'firebrick', label: 'FireBrick', color: '#B22222' },
    { value: 'darkred', label: 'DarkRed', color: '#8B0000' },
    { value: 'pink', label: 'Pink', color: '#FFC0CB' },
    { value: 'lightpink', label: 'LightPink', color: '#FFB6C1' },
    { value: 'hotpink', label: 'HotPink', color: '#FF69B4' },
    { value: 'deeppink', label: 'DeepPink', color: '#FF1493' },
    { value: 'mediumvioletred', label: 'MediumVioletRed', color: '#C71585' },
    { value: 'palevioletred', label: 'PaleVioletRed', color: '#DB7093' },
    { value: 'lightsalmon', label: 'LightSalmon', color: '#FFA07A' },
    { value: 'coral', label: 'Coral', color: '#FF7F50' },
    { value: 'tomato', label: 'Tomato', color: '#FF6347' },
    { value: 'orangered', label: 'OrangeRed', color: '#FF4500' },
    { value: 'darkorange', label: 'DarkOrange', color: '#FF8C00' },
    { value: 'yellow', label: 'yellow', color: '#FFD700' },
    { value: 'gold', label: 'Gold', color: '#FFC436' },
    { value: 'khaki', label: 'Khaki', color: '#cbcc9e' },
    { value: 'darkkhaki', label: 'DarkKhaki', color: '#BDB76B' },
    { value: 'thistle', label: 'Thistle', color: '#D8BFD8' },
    { value: 'plum', label: 'Plum', color: '#DDA0DD' },
    { value: 'violet', label: 'Violet', color: '#EE82EE' },
    { value: 'orchid', label: 'Orchid', color: '#DA70D6' },
    { value: 'mediumorchid', label: 'MediumOrchid', color: '#BA55D3' },
    { value: 'mediumpurple', label: 'MediumPurple', color: '#9370DB' },
    { value: 'rebeccapurple', label: 'RebeccaPurple', color: '#663399' },
    { value: 'blueviolet', label: 'BlueViolet', color: '#8A2BE2' },
    { value: 'darkviolet', label: 'DarkViolet', color: '#9400D3' },
    { value: 'darkorchid', label: 'DarkOrchid', color: '#9932CC' },
    { value: 'darkmagenta', label: 'DarkMagenta', color: '#8B008B' },
    { value: 'purple', label: 'Purple', color: '#800080' },
    { value: 'indigo', label: 'Indigo', color: '#4B0082' },
    { value: 'slateblue', label: 'SlateBlue', color: '#6A5ACD' },
    { value: 'darkslateblue', label: 'DarkSlateBlue', color: '#483D8B' },
    { value: 'mediumslateblue', label: 'MediumSlateBlue', color: '#7B68EE' },
    { value: 'lightgreen', label: 'LightGreen', color: '#90EE90' },
    { value: 'mediumseagreen', label: 'MediumSeaGreen', color: '#3CB371' },
    { value: 'seagreen', label: 'SeaGreen', color: '#2E8B57' },
    { value: 'forestgreen', label: 'ForestGreen', color: '#228B22' },
    { value: 'green', label: 'Green', color: '#008000' },
    { value: 'darkgreen', label: 'DarkGreen', color: '#006400' },
    { value: 'yellowgreen', label: 'YellowGreen', color: '#9ACD32' },
    { value: 'olivedrab', label: 'OliveDrab', color: '#6B8E23' },
    { value: 'olive', label: 'Olive', color: '#808000' },
    { value: 'darkolivegreen', label: 'DarkOliveGreen', color: '#556B2F' },
    { value: 'mediumaquamarine', label: 'MediumAquamarine', color: '#66CDAA' },
    { value: 'darkseagreen', label: 'DarkSeaGreen', color: '#8FBC8B' },
    { value: 'lightseagreen', label: 'LightSeaGreen', color: '#20B2AA' },
    { value: 'darkcyan', label: 'DarkCyan', color: '#008B8B' },
    { value: 'teal', label: 'Teal', color: '#008080' },
    { value: 'turquoise', label: 'Turquoise', color: '#40E0D0' },
    { value: 'mediumturquoise', label: 'MediumTurquoise', color: '#48D1CC' },
    { value: 'darkturquoise', label: 'DarkTurquoise', color: '#00CED1' },
    { value: 'cadetblue', label: 'CadetBlue', color: '#5F9EA0' },
    { value: 'steelblue', label: 'SteelBlue', color: '#4682B4' },
    { value: 'lightsteelblue', label: 'LightSteelBlue', color: '#B0C4DE' },
    { value: 'powderblue', label: 'PowderBlue', color: '#B0E0E6' },
    { value: 'lightblue', label: 'LightBlue', color: '#ADD8E6' },
    { value: 'skyblue', label: 'SkyBlue', color: '#87CEEB' },
    { value: 'lightskyblue', label: 'LightSkyBlue', color: '#87CEFA' },
    { value: 'deepskyblue', label: 'DeepSkyBlue', color: '#00BFFF' },
    { value: 'dodgerblue', label: 'DodgerBlue', color: '#1E90FF' },
    { value: 'cornflowerblue', label: 'CornflowerBlue', color: '#6495ED' },
    { value: 'royalblue', label: 'RoyalBlue', color: '#4169E1' },
    { value: 'blue', label: 'Blue', color: '#0000FF' },
    { value: 'mediumblue', label: 'MediumBlue', color: '#0000CD' },
    { value: 'darkblue', label: 'DarkBlue', color: '#00008B' },
    { value: 'navy', label: 'Navy', color: '#000080' },
    { value: 'midnightblue', label: 'MidnightBlue', color: '#191970' },
    { value: 'burlywood', label: 'BurlyWood', color: '#DEB887' },
    { value: 'tan', label: 'Tan', color: '#D2B48C' },
    { value: 'wheat', label: 'Wheat', color: '#F5DEB3' },
    { value: 'sandybrown', label: 'SandyBrown', color: '#F4A460' },
    { value: 'chocolate', label: 'Chocolate', color: '#D2691E' },
    { value: 'firebrick', label: 'FireBrick', color: '#B22222' },
    { value: 'brown', label: 'Brown', color: '#A52A2A' },
    { value: 'darkred', label: 'DarkRed', color: '#8B0000' },
    { value: 'coral', label: 'Coral', color: '#FF7F50' },
  ];

  return (
    <>
      {/* Champ Nom de la catégorie */}
      <Form.Item
        label="Nom de la catégorie"
        name="categoryName"
        rules={[
          {
            required: true,
            message: 'Veuillez entrer le nom de la catégorie !',
          },
        ]}
      >
        <Input />
      </Form.Item>

      {/* Champ Description */}
      <Form.Item
        label="Description de la catégorie"
        name="categoryDescription"
        rules={[
          {
            required: true,
            message: 'Veuillez entrer une description pour la catégorie !',
          },
        ]}
      >
        <Input.TextArea rows={4} placeholder="Description de la catégorie" />
      </Form.Item>

      {/* Champ Couleur */}
      <Form.Item
        label="Couleur de la catégorie"
        name="categoryColor"
        rules={[
          {
            required: true,
            message: 'Veuillez choisir une couleur pour la catégorie !',
          },
        ]}
      >
        <Select
          placeholder="Sélectionner une couleur"
          options={colorOptions.map((color) => ({
            value: color.value,
            label: (
              <span style={{ color: color.value }}>
                {color.label} {/* Affiche le label dans la couleur choisie */}
              </span>
            ),
          }))}
        />
      </Form.Item>
    </>
  );
}
