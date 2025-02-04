import { useEffect, useState } from "react"
import { Grid, Paper, Typography, Box, CircularProgress, Button } from "@mui/material"
import { LineChart } from "@mui/x-charts"
import { useAuthStore } from "../store/authStore"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

interface PortfolioSummary {
  totalValue: number
  riskLevel: "Low" | "Medium" | "High"
  assetDistribution: {
    type: string
    value: number
  }[]
  historicalValue: {
    date: string
    value: number
  }[]
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPortfolioSummary = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        // Fetch portfolio data
        const { data: portfolios, error: portfolioError } = await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user.id)

        if (portfolioError) throw portfolioError

        // If no portfolio exists, create one
        if (!portfolios || portfolios.length === 0) {
          const { data: newPortfolio, error: createError } = await supabase
            .from("portfolios")
            .insert([
              {
                user_id: user.id,
                total_investments: 0,
              },
            ])
            .select()
            .single()

          if (createError) throw createError

          setSummary({
            totalValue: 0,
            riskLevel: "Low",
            assetDistribution: [],
            historicalValue: [{ date: new Date().toISOString().slice(0, 7), value: 0 }],
          })
          setLoading(false)
          return
        }

        const portfolio = portfolios[0]

        // Fetch investments
        const { data: investments, error: investmentsError } = await supabase
          .from("investments")
          .select("*")
          .eq("portfolio_id", portfolio.id)

        if (investmentsError) throw investmentsError

        if (!investments || investments.length === 0) {
          setSummary({
            totalValue: 0,
            riskLevel: "Low",
            assetDistribution: [],
            historicalValue: [{ date: new Date().toISOString().slice(0, 7), value: 0 }],
          })
          setLoading(false)
          return
        }

        // Calculate total value and distribution
        const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0)
        const assetDistribution = investments.reduce((acc: any[], inv) => {
          const existing = acc.find((a) => a.type === inv.type)
          if (existing) {
            existing.value += inv.value
          } else {
            acc.push({ type: inv.type, value: inv.value })
          }
          return acc
        }, [])

        // Determine risk level based on investment composition
        const riskScores = { Low: 1, Medium: 2, High: 3 }
        const avgRisk = investments.reduce((sum, inv: { risk: "Low" | "Medium" | "High" }) => sum + riskScores[inv.risk], 0) / investments.length
        const riskLevel = avgRisk <= 1.5 ? "Low" : avgRisk <= 2.5 ? "Medium" : "High"

        console.log("Portfolios:", portfolios)
        console.log("Investments:", investments)
        console.log("Calculated summary:", {
          totalValue,
          riskLevel,
          assetDistribution,
          historicalValue: [
            { date: "2024-01", value: totalValue * 0.9 },
            { date: "2024-02", value: totalValue * 0.95 },
            { date: "2024-03", value: totalValue },
          ],
        })

        setSummary({
          totalValue,
          riskLevel,
          assetDistribution,
          historicalValue: [
            { date: "2024-01", value: totalValue * 0.9 },
            { date: "2024-02", value: totalValue * 0.95 },
            { date: "2024-03", value: totalValue },
          ],
        })
      } catch (error) {
        console.error("Error fetching portfolio summary:", error)
        setError("Failed to load portfolio data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioSummary()
  }, [user])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    )
  }

  if (!summary) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" gutterBottom>
          No portfolio data available
        </Typography>
        <Button variant="contained" color="primary"  onClick={() => {
          console.log("Navigating to: /dashboard/investments");
          navigate("/dashboard/investments");
        }}>
          Add Your First Investment
        </Button>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Portfolio Overview
        </Typography>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 140,
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            Total Portfolio Value
          </Typography>
          <Typography component="p" variant="h4">
            ${summary.totalValue.toLocaleString()}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 140,
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            Risk Level
          </Typography>
          <Typography component="p" variant="h4">
            {summary.riskLevel}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Portfolio Value Trend
          </Typography>
          {summary.historicalValue && summary.historicalValue.length > 0 ? (
            <Box sx={{ height: 300 }}>
              <LineChart
                xAxis={[
                  {
                    data: summary.historicalValue.map((_, index) => index),
                    valueFormatter: (index) => summary.historicalValue[index]?.date || "",
                  },
                ]}
                series={[
                  {
                    data: summary.historicalValue.map((d) => d.value || 0),
                    area: true,
                  },
                ]}
                height={300}
              />
            </Box>
          ) : (
            <Typography color="text.secondary" align="center">
              No historical data available yet
            </Typography>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Asset Distribution
          </Typography>
          {summary.assetDistribution && summary.assetDistribution.length > 0 ? (
            <Box sx={{ height: 300 }}>
              <LineChart
                xAxis={[
                  {
                    data: summary.assetDistribution.map((_, index) => index),
                    valueFormatter: (index) => summary.assetDistribution[index]?.type || "",
                  },
                ]}
                series={[
                  {
                    data: summary.assetDistribution.map((d) => d.value || 0),
                    area: true,
                  },
                ]}
                height={300}
              />
            </Box>
          ) : (
            <Typography color="text.secondary" align="center">
              No assets added yet
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  )
}
