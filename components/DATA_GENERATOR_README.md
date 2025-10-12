# Data Generator Components

This directory contains reusable data generation components that can be used throughout the TestFlow Pro application to generate realistic test data.

## Components

### 1. `DataGenerator`
A modal component that provides a comprehensive interface for generating various types of test data.

**Features:**
- 6 categories of data generators (Personal, Numbers & IDs, Date & Time, Internet, Business & Security, Location)
- 25+ built-in generators
- Real-time preview of generated values
- Copy to clipboard functionality
- Customizable options for certain generators (e.g., min/max for random numbers)

### 2. `InputWithGenerator`
A wrapper component that adds data generation functionality to any input field.

**Features:**
- Adds a magic wand icon to input fields
- Integrates seamlessly with existing Input components
- Supports both `onChange` and `onGenerate` callbacks
- Maintains all original input properties

### 3. `ExampleUsage`
A demonstration component showing how to implement the data generator in your forms.

## Usage

### Basic Input with Data Generation

```tsx
import { InputWithGenerator } from "./input-with-generator"

function MyForm() {
  const [email, setEmail] = useState("")

  return (
    <InputWithGenerator
      placeholder="Enter email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onGenerate={(value) => setEmail(value)}
    />
  )
}
```

### Standalone Data Generator Modal

```tsx
import { DataGenerator } from "./data-generator"
import { Button } from "@/components/ui/button"

function MyComponent() {
  const handleGenerate = (value: string) => {
    console.log("Generated:", value)
  }

  return (
    <DataGenerator onGenerate={handleGenerate}>
      <Button>Generate Data</Button>
    </DataGenerator>
  )
}
```

## Available Data Types

### Personal Data
- First Name, Last Name, Full Name
- Username, Email Address, Phone Number

### Numbers & IDs
- Random Number (with min/max options)
- UUID v4, Timestamp, Sequential ID

### Date & Time
- Current Date, Current DateTime
- Future Date, Past Date

### Internet
- URL, Domain Name, IP Address

### Business & Security
- Company Name, Password, API Key
- Credit Card, Currency Amount

### Location
- Street Address, City, ZIP Code
- Country, GPS Coordinates

## Integration with Parameter Manager

The data generator is already integrated into the Parameter Manager component for inline parameter values. Users can:

1. Click the magic wand icon next to any parameter value field
2. Select from 25+ data generators organized by category
3. Preview generated values before using them
4. Generate multiple values until they find the right one

## Customization

### Adding New Generators

To add a new data generator, update the `generators` array in `data-generator.tsx`:

```tsx
{
  id: "myGenerator",
  name: "My Generator",
  description: "Generates my custom data",
  category: "personal", // or any existing category
  icon: <MyIcon className="h-4 w-4" />,
  generate: (options) => {
    // Your generation logic here
    return "generated value"
  }
}
```

### Adding New Categories

To add a new category, update the `categories` array:

```tsx
{ 
  id: "mycategory", 
  name: "My Category", 
  icon: <MyIcon className="h-4 w-4" /> 
}
```

### Custom Options

Some generators support custom options (like min/max for random numbers). Add option handling in the generator's `generate` function and create UI for the options in the DataGenerator component.

## Styling

The components use Tailwind CSS classes and are designed to match the existing TestFlow Pro design system. The data generator modal is responsive and works well on different screen sizes.

## Dependencies

- React 18+
- Tailwind CSS
- Radix UI (for Dialog component)
- Lucide React (for icons)
- Existing TestFlow Pro UI components

## Future Enhancements

Potential improvements for future versions:

1. **Custom Templates**: Allow users to create custom data generation templates
2. **Data Relationships**: Generate related data (e.g., matching first name and email)
3. **Localization**: Support for different locales and languages
4. **Import/Export**: Save and share custom generator configurations
5. **API Integration**: Connect to external data generation services
6. **Bulk Generation**: Generate multiple values at once
7. **Data Validation**: Ensure generated data meets specific format requirements