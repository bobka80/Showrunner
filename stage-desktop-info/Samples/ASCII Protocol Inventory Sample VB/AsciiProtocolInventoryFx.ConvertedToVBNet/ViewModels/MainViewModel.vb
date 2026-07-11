'-----------------------------------------------------------------------
' <copyright file="MainViewModel.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.Linq
Imports System.Text
Imports TechnologySolutions.Rfid.AsciiProtocol
Imports TechnologySolutions.Rfid.AsciiProtocol.Commands

''' <summary>
''' View model for main form
''' </summary>
Public Class MainViewModel
    Inherits PropertyChangedViewModel

    ''' <summary>
    ''' Initializes a new instance of the MainViewModel class
    ''' </summary>
    Public Sub New()
        Dim inventoryCommand As InventoryCommand
        Dim barcodeCommand As BarcodeCommand

        ' Create a display responder to capture and display all reader responses
        AddHandler Service.DisplayResponder.ReceivedLine, AddressOf Me.DisplayResponder_ReceivedLine

        ' setup an asynchronous responder for inventory
        inventoryCommand = New InventoryCommand()
        inventoryCommand.IsIndexedCommand = False
        inventoryCommand.IsLibraryCommand = False
        AddHandler inventoryCommand.TransponderReceived, AddressOf Me.AsynchronousTransponder_Received

        ' setup an asynchronous responder for barcodes
        barcodeCommand = New BarcodeCommand()
        barcodeCommand.IsIndexedCommand = False
        barcodeCommand.IsLibraryCommand = False
        AddHandler barcodeCommand.BarcodeReceived, AddressOf Me.AsynchronousBarcode_Received

        ' set up the responder chain
        Service.Reader.Commander.ClearResponders()
        Service.Reader.Commander.AddResponder(New LoggerResponder())
        Service.Reader.Commander.AddResponder(Service.DisplayResponder)
        Service.Reader.Commander.AddSynchronousResponder()
        Service.Reader.Commander.AddResponder(inventoryCommand.Responder)
        Service.Reader.Commander.AddResponder(barcodeCommand.Responder)
    End Sub

    Public Property Session() As QuerySession
        Get
            Return m_Session
        End Get

        Set(ByVal value As QuerySession)
            m_Session = value
        End Set
    End Property

    Private m_Session As QuerySession

    Public Property Target() As QueryTarget
        Get
            Return m_Target
        End Get

        Set(ByVal value As QueryTarget)
            m_Target = value
        End Set
    End Property

    Private m_Target As QueryTarget

    ''' <summary>
    ''' Raised to indicate transponder information to the user interface
    ''' </summary>
    Public Event TransponderMessageHandler As EventHandler(Of TextEventArgs)

    ''' <summary>
    ''' Raised to indicate transponder information to the user interface
    ''' </summary>
    Public Event BarcodeMessageHandler As EventHandler(Of TextEventArgs)

    ''' <summary>
    ''' Raised for each line of a response received
    ''' </summary>
    Public Event ResponseLine As EventHandler(Of TextEventArgs)

    ''' <summary>
    ''' Raised when a command finishes
    ''' </summary>
    Public Event CommandCompleted As EventHandler

    ''' <summary>
    ''' Execute the Inventory command
    ''' </summary>
    Public Sub ExecuteInventoryCommand(ByVal isCommandSynchronous As Boolean)
        Dim synchronousResponder As IAsciiCommandSynchronousResponder = Nothing

        Try
            ' Create a new Inventory command
            Dim inventory As New InventoryCommand()
            inventory.QuerySession = Me.Session
            inventory.QueryTarget = Me.Target

            If inventory IsNot Nothing Then
                ' 
                synchronousResponder = If(isCommandSynchronous, inventory.Responder, Nothing)
                AddHandler inventory.TransponderReceived, AddressOf Me.SynchronousTransponder_Received
            End If

            Try
                Service.Reader.Commander.ExecuteCommand(inventory, synchronousResponder)
            Finally
                If inventory IsNot Nothing Then
                    RemoveHandler inventory.TransponderReceived, AddressOf Me.SynchronousTransponder_Received
                End If

            End Try
        Catch ex As Exception
            Me.OnTransponderMessage(ex.Message)
        Finally
            Me.OnCommandCompleted()
        End Try
    End Sub

    Public Sub ExecuteBarcodeCommand(ByVal isCommandSynchronous As Boolean)
        Dim synchronousResponder As IAsciiCommandSynchronousResponder = Nothing

        Try
            ' Create a new Inventory command
            Dim bcCommand As New BarcodeCommand()

            If bcCommand IsNot Nothing Then
                ' 
                synchronousResponder = If(isCommandSynchronous, bcCommand.Responder, Nothing)
                AddHandler bcCommand.BarcodeReceived, AddressOf Me.SynchronousBarcode_Received
            End If

            Try
                Service.Reader.Commander.ExecuteCommand(bcCommand, synchronousResponder)
            Finally
                If bcCommand IsNot Nothing Then
                    RemoveHandler bcCommand.BarcodeReceived, AddressOf Me.SynchronousBarcode_Received
                End If
            End Try


            ' Report the error messages for unsuccessful synchronous commands
            If isCommandSynchronous AndAlso Not bcCommand.Response.IsSuccessful Then
                For Each message As String In bcCommand.Response.Messages
                    Me.OnBarcodeMessage(message)
                Next

            End If
        Catch ex As Exception
            Me.OnBarcodeMessage(ex.Message)
        Finally
            Me.OnCommandCompleted()
        End Try
    End Sub

    ''' <summary>
    ''' Raises the <see cref="CommandCompleted"/> event
    ''' </summary>
    Protected Overridable Sub OnCommandCompleted()
        RaiseEvent CommandCompleted(Me, EventArgs.Empty)
    End Sub

    ''' <summary>
    ''' Raises the <see cref="TransponderMessageHandler"/> event
    ''' </summary>
    ''' <param name="value">The message to display</param>
    Protected Overridable Sub OnTransponderMessage(ByVal value As String)
        RaiseEvent TransponderMessageHandler(Me, New TextEventArgs(value))
    End Sub

    ''' <summary>
    ''' Raises the <see cref="BarcodeMessageHandler"/> event
    ''' </summary>
    ''' <param name="value">The message to display</param>
    Protected Overridable Sub OnBarcodeMessage(ByVal value As String)
        RaiseEvent BarcodeMessageHandler(Me, New TextEventArgs(value))
    End Sub

    ''' <summary>
    ''' Raises the <see cref="ResponseLine"/> event
    ''' </summary>
    ''' <param name="value">The line to display</param>
    Protected Overridable Sub OnResponseLine(ByVal value As String)
        RaiseEvent ResponseLine(Me, New TextEventArgs(value))
    End Sub

    Private Sub AsynchronousTransponder_Received(ByVal sender As Object, ByVal e As TransponderDataEventArgs)
        Me.IssueTransponderMessage("[Async] ", e)
    End Sub

    Private Sub SynchronousTransponder_Received(ByVal sender As Object, ByVal e As TransponderDataEventArgs)
        Me.IssueTransponderMessage("[Sync] ", e)
    End Sub

    Private Sub IssueTransponderMessage(ByVal prefix As String, ByVal e As TransponderDataEventArgs)
        Dim message As String = String.Format(System.Globalization.CultureInfo.CurrentUICulture, "{0,-8} EPC: {1}", prefix, e.Transponder.Epc)
        Me.OnTransponderMessage(message)
    End Sub

    Private Sub AsynchronousBarcode_Received(ByVal sender As Object, ByVal e As BarcodeEventArgs)
        Me.IssueBarcodeMessage("[Async] ", e)
    End Sub

    Private Sub SynchronousBarcode_Received(ByVal sender As Object, ByVal e As BarcodeEventArgs)
        Me.IssueBarcodeMessage("[Sync] ", e)
    End Sub

    Private Sub IssueBarcodeMessage(ByVal prefix As String, ByVal e As BarcodeEventArgs)
        Dim message As String = String.Format(System.Globalization.CultureInfo.CurrentUICulture, "{0,-8} Barcode: {1}", prefix, e.Barcode)
        Me.OnBarcodeMessage(message)
    End Sub

    Private Sub DisplayResponder_ReceivedLine(ByVal sender As Object, ByVal e As AsciiLineEventArgs)
        Me.OnResponseLine(e.Line.FullLine)
    End Sub
End Class
