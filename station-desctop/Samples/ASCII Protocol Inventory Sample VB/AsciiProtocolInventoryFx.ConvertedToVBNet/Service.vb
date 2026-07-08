
Imports System.Collections.Generic
Imports System.Linq
Imports System.Text

Imports TechnologySolutions.Rfid.AsciiProtocol

Public Class Service
	Public Shared Sub StartUp()
		DisplayResponder = New DisplayResponder()
		Reader = New ReaderService()
	End Sub

	Public Shared Property Reader() As ReaderService
		Get
			Return m_Reader
		End Get
		Set
			m_Reader = Value
		End Set
	End Property
	Private Shared m_Reader As ReaderService

	Public Shared Property DisplayResponder() As DisplayResponder
		Get
			Return m_DisplayResponder
		End Get
		Set
			m_DisplayResponder = Value
		End Set
	End Property
	Private Shared m_DisplayResponder As DisplayResponder

	Friend Shared ReadOnly Property Settings() As Properties.Settings
		Get
			Return Properties.Settings.[Default]
		End Get
	End Property

	Public Shared Sub ShutDown()
		Dispose(Reader)
		Dispose(DisplayResponder)
	End Sub

	Public Shared Function Dispose(value As Object) As Boolean
		Dim disposable As IDisposable

		disposable = TryCast(value, IDisposable)
		If disposable IsNot Nothing Then
			disposable.Dispose()
			Return True
		End If

		Return False
	End Function
End Class
