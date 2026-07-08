'-----------------------------------------------------------------------
' <copyright file="TextEventArgs.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.Linq
Imports System.Text

''' <summary>
''' Provides a text parameter for events
''' </summary>
Public Class TextEventArgs
	Inherits EventArgs
	''' <summary>
	''' Initializes a new instance of the TextEventArgs class
	''' </summary>
	''' <param name="text">The Text value</param>
	Public Sub New(text As String)
		Me.Text = text
	End Sub

	''' <summary>
	''' Gets the text value
	''' </summary>
	Public Property Text() As String
		Get
			Return m_Text
		End Get
		Private Set
			m_Text = Value
		End Set
	End Property
	Private m_Text As String
End Class
