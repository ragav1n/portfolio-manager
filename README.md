# Investment Portfolio Management System

A comprehensive Investment Portfolio Management System that integrates MySQL for structured data analysis and AI for predictive risk assessment. This system provides personalized portfolio insights, real-time monitoring, and a scalable relational database for secure financial data handling.

## Features
- **User Authentication**: Secure login & registration
- **Portfolio Management**: Track stocks, mutual funds, and assets
- **Real-Time Monitoring**: Fetch and update market data
- **Predictive Analytics**: AI-driven risk assessment and performance prediction
- **Data Visualization**: Interactive charts for insights

## Tech Stack
- **Backend**: Python (Flask/Django)
- **Frontend**: React.js / Flutter (if mobile app is included)
- **Database**: MySQL
- **AI/ML**: TensorFlow/PyTorch for predictive analysis
- **APIs**: Alpha Vantage, Yahoo Finance

## Installation & Setup

### Prerequisites
- Python 3.8+
- MySQL Server
- Node.js (if using React for frontend)
- Virtual Environment (Optional but recommended)

### Clone the Repository
```bash
git clone https://github.com/your-username/investment-portfolio-management.git
cd investment-portfolio-management
```

### Backend Setup
1. Create a virtual environment (optional but recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```
2. Install dependencies
```bash
pip install -r requirements.txt
```
3. Configure `.env` file with MySQL credentials
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=portfolio_db
```
4. Initialize Database
```bash
python setup_db.py
```
5. Run the Backend Server
```bash
python app.py
```

### Frontend Setup (React)
```bash
cd frontend
npm install
npm start
```

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | User authentication |
| `/api/portfolio` | GET | Fetch portfolio data |
| `/api/market-data` | GET | Retrieve market insights |
| `/api/predict` | POST | AI-based predictions |

## Contributing
Feel free to fork this repository and submit pull requests. Make sure to follow best practices and add meaningful commits.

---
**Maintainer:** Prajwal M ([prajwal26sunil@gmail.com](mailto:prajwal26sunil@gmail.com))
